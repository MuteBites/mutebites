-- Access rules for the add-on tables (RLS was off until this ran), plus
-- Waffle Pops' four extras at their printed prices, offered on every
-- section except Hot Chocolate.

alter table public.addons enable row level security;
alter table public.category_addons enable row level security;
alter table public.order_item_addons enable row level security;

-- Menus are public to read; only admins change them (same as dishes).
create policy "Anyone can view addons" on public.addons for select using (true);
create policy "Admins can insert addons" on public.addons for insert with check (public.is_admin());
create policy "Admins can update addons" on public.addons for update using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete addons" on public.addons for delete using (public.is_admin());

create policy "Anyone can view category addons" on public.category_addons for select using (true);
create policy "Admins can insert category addons" on public.category_addons for insert with check (public.is_admin());
create policy "Admins can delete category addons" on public.category_addons for delete using (public.is_admin());

-- Chosen extras: the order's own student and admins can read; nobody
-- writes directly — only place_order() (security definer) inserts.
create policy "Users can view own order item addons" on public.order_item_addons
  for select using (
    exists (
      select 1 from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.id = order_item_addons.order_item_id and o.user_id = auth.uid()
    )
  );
create policy "Admins can view all order item addons" on public.order_item_addons
  for select using (public.is_admin());

-- Waffle Pops' extras.
with r as (select id from public.restaurants where name = 'Waffle Pops'),
a as (
  insert into public.addons (restaurant_id, name, price, sort_order)
  select r.id, v.name, v.price, v.sort_order
  from r, (values
    ('Choco chip', 10, 0),
    ('Ice cream', 30, 1),
    ('Chopped chocolates', 10, 2),
    ('Oreo', 10, 3)
  ) as v (name, price, sort_order)
  returning id
)
insert into public.category_addons (category_id, addon_id)
select c.id, a.id
from a
cross join public.dish_categories c
join r on c.restaurant_id = r.id
where c.name <> 'Hot Chocolate';
