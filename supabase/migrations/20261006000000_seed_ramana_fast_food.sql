-- Data only — a seventh restaurant, Ramana Fast Food: 2 sections, 16
-- dishes. "Dubble" on the printed menu is written "Double" here, matching
-- Food Corner's existing dish names.

with r as (
  insert into public.restaurants (name, phone, description, cuisine_tags, is_active)
  values ('Ramana Fast Food', '+918247075652', 'Tasty Food, Happy Mood!',
          array['Fried Rice', 'Noodles', 'Chinese'], true)
  returning id
),
c as (
  insert into public.dish_categories (restaurant_id, name, sort_order)
  select r.id, v.name, v.sort_order
  from r, (values ('Fried Rice', 0), ('Noodles', 1)) as v (name, sort_order)
  returning id, name
)
insert into public.dishes (restaurant_id, category_id, name, price, is_veg, note, sort_order)
select r.id, c.id, v.name, v.price, v.is_veg, null, v.sort_order
from (values
    ('Fried Rice', 'Veg Fried Rice', 90, true, 0),
    ('Fried Rice', 'Egg Fried Rice', 100, false, 1),
    ('Fried Rice', 'Double Egg Fried Rice', 110, false, 2),
    ('Fried Rice', 'Veg Manchurian Fried Rice', 100, true, 3),
    ('Fried Rice', 'Egg Manchurian Fried Rice', 110, false, 4),
    ('Fried Rice', 'Chicken Fried Rice', 120, false, 5),
    ('Fried Rice', 'Double Egg Chicken Fried Rice', 130, false, 6),
    ('Noodles', 'Veg Noodles', 90, true, 0),
    ('Noodles', 'Veg Manchurian', 90, true, 1),
    ('Noodles', 'Egg Manchurian', 100, false, 2),
    ('Noodles', 'Egg Noodles', 100, false, 3),
    ('Noodles', 'Double Egg Noodles', 110, false, 4),
    ('Noodles', 'Veg Manchurian Noodles', 100, true, 5),
    ('Noodles', 'Egg Manchurian Noodles', 110, false, 6),
    ('Noodles', 'Chicken Noodles', 120, false, 7),
    ('Noodles', 'Double Egg Chicken Noodles', 130, false, 8)
) as v (category, name, price, is_veg, sort_order)
join c on c.name = v.category
cross join r;
