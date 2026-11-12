-- "Remove restaurant" / "Add back" in admin Menus (12 Nov 2026). A
-- restaurant with past orders can't be deleted (orders.restaurant_id is
-- on delete restrict, and history must keep its name), so removing one
-- stamps archived_at instead: the app hides it everywhere, and Add back
-- clears it. Existing admin update policies cover the column.

-- When the admin removed the restaurant; null = it's on the app.
alter table public.restaurants
  add column archived_at timestamptz;

-- A removed restaurant can never take orders: it must stay switched off
-- (place_order() already refuses a restaurant that isn't active).
alter table public.restaurants
  add constraint restaurants_archived_inactive
    check (archived_at is null or not is_active);
