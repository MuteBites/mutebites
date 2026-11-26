-- Spice Magic (MuteBites x FoodHub) orders, kept so the student sees them in
-- Orders and on a FoodHub-style tracking page (27 Nov 2026). FoodHub takes
-- the order on WhatsApp; nothing here is a MuteBites order (no token, no
-- status: the page shows it delivered after 8:30 PM). Written by
-- preparePartnerOrder() with the student's own session after its checks.
create table public.partner_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  restaurant_id uuid references public.restaurants (id) on delete set null,
  restaurant_name text not null,
  items jsonb not null,
  total_amount integer not null check (total_amount >= 0),
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now()
);

create index partner_orders_user_created_idx on public.partner_orders (user_id, created_at desc);

alter table public.partner_orders enable row level security;

create policy "Students read their own partner orders"
  on public.partner_orders for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy "Students add their own partner orders"
  on public.partner_orders for insert to authenticated
  with check (user_id = (select auth.uid()));
