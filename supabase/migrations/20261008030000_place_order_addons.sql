-- place_order() with add-ons: each cart line may carry "addon_ids"; every
-- add-on is checked (this restaurant, available, offered on the dish's
-- section) and priced from the database, snapshotted into
-- order_item_addons, and added to the line via order_items.addons_price
-- (subtotal includes it). The same dish may now appear twice when its
-- add-ons differ. New error key: addon_unavailable. Everything else —
-- schedule, ban, rate limits, phone/notes/restaurant checks — unchanged
-- from 20260922000000_place_order_rate_limit.sql; grants kept.
create or replace function public.place_order(
  p_restaurant_id uuid,
  p_items jsonb,
  p_contact_phone text,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
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
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;
  if not exists (select 1 from users where id = v_user_id) then
    raise exception 'profile_missing';
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

  -- Rate limit. The per-student lock (released when this transaction
  -- ends) makes two taps at the same instant count one after the other,
  -- so both can't slip under the limit together.
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
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'empty_cart';
  end if;

  -- Pass 1: check every line before writing anything. A line is a dish,
  -- a quantity and an optional list of add-on ids; the same dish may
  -- appear twice only with different add-ons.
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

    select d.id, d.category_id into v_dish
      from dishes d
     where d.id = v_dish_id and d.restaurant_id = p_restaurant_id and d.is_available;
    if not found then
      raise exception 'dish_unavailable';
    end if;

    -- Every add-on must belong to this restaurant, be available, and be
    -- offered on this dish's section.
    if cardinality(v_addon_ids) > 0 and (
      select count(*) from addons a
        join category_addons ca on ca.addon_id = a.id and ca.category_id = v_dish.category_id
       where a.id = any(v_addon_ids) and a.restaurant_id = p_restaurant_id and a.is_available
    ) <> cardinality(v_addon_ids) then
      raise exception 'addon_unavailable';
    end if;
  end loop;

  insert into orders (user_id, restaurant_id, contact_phone, notes, total_amount)
  values (v_user_id, p_restaurant_id, p_contact_phone, nullif(trim(p_notes), ''), 0)
  returning id into v_order_id;

  -- Pass 2: write each line, prices (dish and add-ons) from the database.
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

  update orders
     set total_amount = (select sum(subtotal) from order_items where order_id = v_order_id)
   where id = v_order_id;

  return v_order_id;
end;
$$;
