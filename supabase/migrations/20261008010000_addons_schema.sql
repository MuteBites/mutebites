-- Add-ons ("extras") on dishes. Applied 2026-10-08 straight from the chat
-- draft, before access rules — those follow in 20261008020000.

create table public.addons (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null check (price >= 0),
  is_available boolean not null default true,
  sort_order int not null default 0
);
create table public.category_addons (
  category_id uuid not null references public.dish_categories(id) on delete cascade,
  addon_id uuid not null references public.addons(id) on delete cascade,
  primary key (category_id, addon_id)
);
create table public.order_item_addons (
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  addon_id uuid references public.addons(id) on delete set null,
  addon_name text not null,
  price numeric(10,2) not null,
  primary key (order_item_id, addon_name)
);
alter table public.order_items add column addons_price numeric(10,2) not null default 0;
alter table public.order_items drop column subtotal;
alter table public.order_items
  add column subtotal numeric(10,2) generated always as ((unit_price + addons_price) * quantity) stored;
