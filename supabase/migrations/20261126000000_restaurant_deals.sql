-- Restaurant deals (26 Nov 2026): auto-applied, each with an admin switch
-- (Offers page). Rules live here and in src/lib/deals.ts — change both.
-- Per group only the biggest deal reached (and switched on) applies, once per
-- order; they combine with the discount the student picks.
--   A1 Biryani Point (any dish in "Biryani Specials"): 5 → 1 L Thums Up,
--     10 → Chicken 65 Biryani (full).
--   Shawarma Hub ("Chicken Shawarma"): 5 → ₹50 off, 11 → ₹210 off.
--   Bheemasena full biryanis (Veg / Non-Veg Biryani): 2 → Thums Up (pet
--     bottle), 5 → Chicken Curry or Half Chicken 65 (student picks),
--     10 → any 2 mini (Single Biryani) biryanis (student picks).
--   Bheemasena mini biryanis (Single Biryani): 10 → Chicken Fry Biryani (full).
-- Gifts are handed over with the order (no price change); only Shawarma's
-- are money off (orders.deal_amount). orders.deals = [{key, label, off}].

create table public.deal_switches (
  key text primary key check (key in ('a1_5','a1_10','shawarma_5','shawarma_11','bh_full_2','bh_full_5','bh_full_10','bh_mini_10')),
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.deal_switches enable row level security;
create policy "anyone reads deal switches" on public.deal_switches for select to anon, authenticated using (true);
create policy "admins flip deal switches" on public.deal_switches for update to authenticated using (public.is_admin()) with check (public.is_admin());
insert into public.deal_switches (key) values
  ('a1_5'),('a1_10'),('shawarma_5'),('shawarma_11'),('bh_full_2'),('bh_full_5'),('bh_full_10'),('bh_mini_10');

alter table public.orders
  add column deals jsonb not null default '[]'::jsonb,
  add column deal_amount numeric(10,2) not null default 0 check (deal_amount >= 0);

do $mig$
declare
  def text;
begin
  def := pg_get_functiondef('public.place_order(uuid, jsonb, text, text, text, jsonb)'::regprocedure);

  def := replace(def, 'p_free_items jsonb DEFAULT NULL::jsonb)',
                      'p_free_items jsonb DEFAULT NULL::jsonb, p_deal_choices jsonb DEFAULT NULL::jsonb)');

  def := replace(def, '  v_promised timestamptz;', '  v_promised timestamptz;
  v_rname text;
  v_n_a1 int; v_n_sh int; v_n_full int; v_n_mini int;
  v_on text[];
  v_deals jsonb := ''[]''::jsonb;
  v_deal_off numeric := 0;
  v_pick text; v_pick2 text;
  v_opts text[];');

  def := replace(def, '  update orders
     set discount_amount = v_discount,
         total_amount = (select sum(subtotal) from order_items where order_id = v_order_id) - v_discount',
'  -- restaurant deals (20261126000000_restaurant_deals.sql)
  select r.name into v_rname from restaurants r where r.id = p_restaurant_id;
  select
    coalesce(sum(it.q) filter (where v_rname = ''A1 Biryani Point'' and c.name = ''Biryani Specials''), 0),
    coalesce(sum(it.q) filter (where v_rname = ''Shawarma Hub'' and d.name = ''Chicken Shawarma''), 0),
    coalesce(sum(it.q) filter (where v_rname = ''Bheemasena Restaurant'' and c.name in (''Veg Biryani'', ''Non-Veg Biryani'')), 0),
    coalesce(sum(it.q) filter (where v_rname = ''Bheemasena Restaurant'' and c.name = ''Single Biryani''), 0)
  into v_n_a1, v_n_sh, v_n_full, v_n_mini
  from (select (e->>''dish_id'')::uuid as id, (e->>''quantity'')::int as q from jsonb_array_elements(p_items) e) it
  join dishes d on d.id = it.id
  left join dish_categories c on c.id = d.category_id;
  select coalesce(array_agg(key) filter (where enabled), ''{}'') into v_on from deal_switches;

  if v_n_a1 >= 10 and ''a1_10'' = any(v_on) then
    v_deals := v_deals || jsonb_build_object(''key'', ''a1_10'', ''label'', ''Free Chicken 65 Biryani (full)'', ''off'', 0);
  elsif v_n_a1 >= 5 and ''a1_5'' = any(v_on) then
    v_deals := v_deals || jsonb_build_object(''key'', ''a1_5'', ''label'', ''Free 1 litre Thums Up'', ''off'', 0);
  end if;

  if v_n_sh >= 11 and ''shawarma_11'' = any(v_on) then
    v_deals := v_deals || jsonb_build_object(''key'', ''shawarma_11'', ''label'', ''₹210 off on 11 Chicken Shawarmas'', ''off'', 210);
  elsif v_n_sh >= 5 and ''shawarma_5'' = any(v_on) then
    v_deals := v_deals || jsonb_build_object(''key'', ''shawarma_5'', ''label'', ''₹50 off on 5 Chicken Shawarmas'', ''off'', 50);
  end if;

  if v_n_full >= 10 and ''bh_full_10'' = any(v_on) then
    select array_agg(d.name order by d.price, d.name) into v_opts
      from dishes d join dish_categories c on c.id = d.category_id
     where d.restaurant_id = p_restaurant_id and d.is_available and c.name = ''Single Biryani'';
    v_pick := p_deal_choices->''bh_full_10''->>0;
    v_pick2 := p_deal_choices->''bh_full_10''->>1;
    if v_pick is null or not (v_pick = any(coalesce(v_opts, ''{}''))) then v_pick := v_opts[1]; end if;
    if v_pick2 is null or not (v_pick2 = any(coalesce(v_opts, ''{}''))) then v_pick2 := v_pick; end if;
    v_deals := v_deals || jsonb_build_object(''key'', ''bh_full_10'', ''off'', 0, ''label'',
      case when v_pick is null then ''Free 2 mini biryanis''
           when v_pick = v_pick2 then ''Free mini biryanis: '' || v_pick || '' × 2''
           else ''Free mini biryanis: '' || v_pick || '' + '' || v_pick2 end);
  elsif v_n_full >= 5 and ''bh_full_5'' = any(v_on) then
    v_pick := p_deal_choices->''bh_full_5''->>0;
    if v_pick is null or v_pick not in (''Chicken Curry'', ''Half Chicken 65'') then v_pick := ''Chicken Curry''; end if;
    v_deals := v_deals || jsonb_build_object(''key'', ''bh_full_5'', ''label'', ''Free '' || v_pick, ''off'', 0);
  elsif v_n_full >= 2 and ''bh_full_2'' = any(v_on) then
    v_deals := v_deals || jsonb_build_object(''key'', ''bh_full_2'', ''label'', ''Free Thums Up (pet bottle)'', ''off'', 0);
  end if;

  if v_n_mini >= 10 and ''bh_mini_10'' = any(v_on) then
    v_deals := v_deals || jsonb_build_object(''key'', ''bh_mini_10'', ''label'', ''Free Chicken Fry Biryani (full)'', ''off'', 0);
  end if;

  select coalesce(sum((x->>''off'')::numeric), 0) into v_deal_off from jsonb_array_elements(v_deals) x;

  update orders
     set discount_amount = v_discount,
         deals = v_deals,
         deal_amount = v_deal_off,
         total_amount = greatest((select sum(subtotal) from order_items where order_id = v_order_id) - v_discount - v_deal_off, 0)');

  if position('p_deal_choices jsonb DEFAULT' in def) = 0 or position('v_deal_off numeric' in def) = 0
     or position('deal_amount = v_deal_off' in def) = 0 then
    raise exception 'place_order patch did not apply';
  end if;

  drop function public.place_order(uuid, jsonb, text, text, text, jsonb);
  execute def;
end
$mig$;

revoke all on function public.place_order(uuid, jsonb, text, text, text, jsonb, jsonb) from public, anon;
grant execute on function public.place_order(uuid, jsonb, text, text, text, jsonb, jsonb) to authenticated;
