-- Delivery times set by the admin, per restaurant (12 Nov 2026). Lunch
-- stays fixed (orders before 12:45 PM IST are delivered 1:45–2 PM), but the
-- evening and night batches move day to day and the old fixed slots
-- (7:30 / 8:15 PM) didn't match them. So for those the admin sets, per
-- restaurant, when it'll be delivered — an exact time, or "within N
-- minutes" (stored as the time it comes to) — plus an optional note and
-- the delivery person's phone. It counts for the IST day it was set on;
-- after 12:45 PM with none set today, place_order() refuses (no fallback,
-- by decision).

create table public.delivery_info (
  restaurant_id  uuid primary key references public.restaurants (id) on delete cascade,
  mode           text not null check (mode in ('at', 'within')),
  -- When it'll be at Main Gate. For 'within', updated_at + within_minutes.
  deliver_at     timestamptz not null,
  within_minutes int check (within_minutes between 5 and 180),
  note           text check (char_length(note) <= 200),
  rider_phone    text check (rider_phone ~ '^\+91[6-9][0-9]{9}$'),
  updated_at     timestamptz not null default now(),
  updated_by     uuid references public.users (id) on delete set null,
  check ((mode = 'within') = (within_minutes is not null))
);

alter table public.delivery_info enable row level security;

-- Signed-in students read it (their ticket shows it); admins write it.
create policy "Signed-in users can read delivery info"
  on public.delivery_info for select to authenticated
  using (true);
create policy "Admins can add delivery info"
  on public.delivery_info for insert to authenticated
  with check (public.is_admin());
create policy "Admins can change delivery info"
  on public.delivery_info for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins can clear delivery info"
  on public.delivery_info for delete to authenticated
  using (public.is_admin());

-- Open tickets update live when the admin changes a time.
alter publication supabase_realtime add table public.delivery_info;

-- Is a delivery time set for this restaurant today (IST)?
create or replace function public.delivery_set_today(p_restaurant_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from delivery_info
     where restaurant_id = p_restaurant_id
       and (updated_at at time zone 'Asia/Kolkata')::date = (now() at time zone 'Asia/Kolkata')::date
  );
$$;
revoke execute on function public.delivery_set_today(uuid) from public, anon;
grant execute on function public.delivery_set_today(uuid) to authenticated;

-- place_order(): the live version with one new check after restaurant_closed.
CREATE OR REPLACE FUNCTION public.place_order(p_restaurant_id uuid, p_items jsonb, p_contact_phone text, p_notes text DEFAULT NULL::text, p_offer text DEFAULT NULL::text, p_free_items jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_item jsonb;
  v_dish_id uuid;
  v_qty int;
  v_addon_ids uuid[];
  v_dish record;
  v_addons_price numeric(10,2);
  v_order_item_id uuid;
  v_keys text[] := '{}';
  v_key text;
  v_settings app_settings;
  v_paid_total numeric;
  v_discount numeric := 0;
  v_full_count int := 0;
  v_free_count int;
  v_has_free boolean := p_free_items is not null
                        and jsonb_typeof(p_free_items) = 'array'
                        and jsonb_array_length(p_free_items) > 0;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;
  if not exists (select 1 from users where id = v_user_id) then
    raise exception 'profile_missing';
  end if;
  if (select mode from site_status) <> 'live' then
    raise exception 'site_offline';
  end if;
  if not public.ordering_is_open() then
    if (select ordering_mode from app_settings) = 'closed' then
      raise exception 'ordering_paused';
    end if;
    raise exception 'ordering_closed';
  end if;
  if current_user_is_banned() then
    raise exception 'banned';
  end if;

  -- Rate limit, under a per-student lock so simultaneous taps queue.
  perform pg_advisory_xact_lock(hashtext('place_order:' || v_user_id::text));
  if (select count(*) from orders
       where user_id = v_user_id
         and created_at > now() - interval '1 minute') >= 5 then
    raise exception 'order_rate_limited';
  end if;
  if (select count(*) from orders
       where user_id = v_user_id
         and status not in ('delivered', 'cancelled')) >= 8 then
    raise exception 'too_many_open_orders';
  end if;

  if p_contact_phone is null or p_contact_phone !~ '^\+91[6-9][0-9]{9}$' then
    raise exception 'invalid_contact_phone';
  end if;
  if p_notes is not null and length(p_notes) > 200 then
    raise exception 'notes_too_long';
  end if;
  if not exists (select 1 from restaurants where id = p_restaurant_id and is_active) then
    raise exception 'restaurant_closed';
  end if;
  -- After the lunch cut-off (12:45 PM IST), no delivery time set for today
  -- = no promise to make, so no order. Lunch is fixed (1:45–2 PM).
  if (now() at time zone 'Asia/Kolkata')::time >= time '12:45'
     and not public.delivery_set_today(p_restaurant_id) then
    raise exception 'no_delivery_time';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'empty_cart';
  end if;

  -- Pass 1: check every paid line (unchanged from the add-ons version).
  for v_item in select value from jsonb_array_elements(p_items) loop
    begin
      v_dish_id := (v_item->>'dish_id')::uuid;
      v_qty := (v_item->>'quantity')::int;
      if v_item ? 'addon_ids' and jsonb_typeof(v_item->'addon_ids') <> 'array' then
        raise exception 'bad addon_ids';
      end if;
      v_addon_ids := coalesce(
        array(select x::uuid from jsonb_array_elements_text(coalesce(v_item->'addon_ids', '[]'::jsonb)) x order by 1),
        '{}'
      );
    exception when others then
      raise exception 'invalid_items';
    end;

    if v_dish_id is null or v_qty is null or v_qty not between 1 and 20
       or cardinality(v_addon_ids) <> (select count(distinct a) from unnest(v_addon_ids) a) then
      raise exception 'invalid_items';
    end if;

    v_key := v_dish_id::text || ':' || array_to_string(v_addon_ids, ',');
    if v_key = any(v_keys) then
      raise exception 'invalid_items';
    end if;
    v_keys := v_keys || v_key;

    select d.id, d.category_id, c.name as section into v_dish
      from dishes d left join dish_categories c on c.id = d.category_id
     where d.id = v_dish_id and d.restaurant_id = p_restaurant_id and d.is_available;
    if not found then
      raise exception 'dish_unavailable';
    end if;

    if cardinality(v_addon_ids) > 0 and (
      select count(*) from addons a
        join category_addons ca on ca.addon_id = a.id and ca.category_id = v_dish.category_id
       where a.id = any(v_addon_ids) and a.restaurant_id = p_restaurant_id and a.is_available
    ) <> cardinality(v_addon_ids) then
      raise exception 'addon_unavailable';
    end if;

    if v_dish.section in ('Veg Biryani', 'Non-Veg Biryani') then
      v_full_count := v_full_count + v_qty;
    end if;
  end loop;

  -- Offers --------------------------------------------------------------
  create temporary table _free (dish_id uuid, quantity int) on commit drop;

  if p_offer is null then
    if v_has_free then
      raise exception 'invalid_items';
    end if;
  else
    select * into v_settings from app_settings;
    if p_offer not in ('pct5', 'pct10', 'pct20', 'biryani')
       or (p_offer = 'pct5' and not v_settings.offer_pct5)
       or (p_offer = 'pct10' and not v_settings.offer_pct10)
       or (p_offer = 'pct20' and not v_settings.offer_pct20)
       or (p_offer = 'biryani' and not v_settings.offer_biryani) then
      raise exception 'offer_unavailable';
    end if;
    -- 5% / 10% / 20%: every restaurant unless the admin switched it off for
    -- that offer. Biryani: only offers_restaurant_id (Bheemasena).
    if (p_offer = 'biryani' and v_settings.offers_restaurant_id is distinct from p_restaurant_id)
       or (p_offer in ('pct5', 'pct10', 'pct20') and exists (
             select 1 from offer_restaurant_exclusions
              where offer = p_offer and restaurant_id = p_restaurant_id)) then
      raise exception 'offer_wrong_restaurant';
    end if;

    if p_offer = 'biryani' then
      if not v_has_free then
        raise exception 'offer_not_eligible';
      end if;
      begin
        insert into _free
          select (e->>'dish_id')::uuid, (e->>'quantity')::int
          from jsonb_array_elements(p_free_items) e;
      exception when others then
        raise exception 'invalid_items';
      end;
      if exists (select 1 from _free where dish_id is null or quantity is null or quantity < 1)
         or (select count(distinct dish_id) from _free) <> (select count(*) from _free) then
        raise exception 'invalid_items';
      end if;
      -- Every free pick is an available single biryani from this restaurant.
      if (select count(*) from _free f
            join dishes d on d.id = f.dish_id
            join dish_categories c on c.id = d.category_id
           where d.restaurant_id = p_restaurant_id and d.is_available
             and c.name = 'Single Biryani') <> (select count(*) from _free) then
        raise exception 'offer_not_eligible';
      end if;
      -- One free single per 3 paid full biryanis.
      select sum(quantity) into v_free_count from _free;
      if v_free_count > v_full_count / 3 then
        raise exception 'offer_not_eligible';
      end if;
    elsif v_has_free then
      raise exception 'invalid_items';
    end if;
  end if;

  -- Write -----------------------------------------------------------------
  insert into orders (user_id, restaurant_id, contact_phone, notes, total_amount, discount_offer)
  values (v_user_id, p_restaurant_id, p_contact_phone, nullif(trim(p_notes), ''), 0, p_offer)
  returning id into v_order_id;

  -- Pass 2: paid lines, prices (dish and add-ons) from the database.
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_dish_id := (v_item->>'dish_id')::uuid;
    v_qty := (v_item->>'quantity')::int;
    v_addon_ids := coalesce(
      array(select x::uuid from jsonb_array_elements_text(coalesce(v_item->'addon_ids', '[]'::jsonb)) x),
      '{}'
    );
    select coalesce(sum(a.price), 0) into v_addons_price from addons a where a.id = any(v_addon_ids);

    insert into order_items (order_id, dish_id, dish_name, unit_price, quantity, addons_price)
    select v_order_id, d.id, d.name, d.price, v_qty, v_addons_price
      from dishes d where d.id = v_dish_id
    returning id into v_order_item_id;

    insert into order_item_addons (order_item_id, addon_id, addon_name, price)
    select v_order_item_id, a.id, a.name, a.price
      from addons a where a.id = any(v_addon_ids);
  end loop;

  -- Free singles: their own rows at the menu price, flagged free.
  insert into order_items (order_id, dish_id, dish_name, unit_price, quantity, is_free)
  select v_order_id, d.id, d.name, d.price, f.quantity, true
    from _free f join dishes d on d.id = f.dish_id;

  select coalesce(sum(subtotal) filter (where not is_free), 0) into v_paid_total
    from order_items where order_id = v_order_id;

  v_discount := case p_offer
    when 'pct5' then round(v_paid_total * 0.05)
    when 'pct10' then round(v_paid_total * 0.10)
    when 'pct20' then round(v_paid_total * 0.20)
    when 'biryani' then (select coalesce(sum(subtotal), 0) from order_items
                          where order_id = v_order_id and is_free)
    else 0
  end;

  update orders
     set discount_amount = v_discount,
         total_amount = (select sum(subtotal) from order_items where order_id = v_order_id) - v_discount
   where id = v_order_id;

  return v_order_id;
end;
$function$;
