-- Data only — a sixth partner restaurant, MuteBites Sugarcane Juice, with
-- one dish. Photos are matched by name in src/lib/data/dish-photos.ts.

with r as (
  insert into public.restaurants (name, phone, description, cuisine_tags, is_active)
  values ('MuteBites Sugarcane Juice', '+918247075652', null, array['Juice', 'Sugarcane'], true)
  returning id
),
c as (
  insert into public.dish_categories (restaurant_id, name, sort_order)
  select r.id, 'Sugarcane Juice', 0
  from r
  returning id
)
insert into public.dishes (restaurant_id, category_id, name, price, is_veg, note, sort_order)
select r.id, c.id, '1 Litre Sugarcane Juice Bottle', 90, true, null, 0
from r, c;
