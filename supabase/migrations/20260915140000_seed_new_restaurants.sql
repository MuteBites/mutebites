-- Seed: two new partner restaurants — MuteBites Chinese and MuteBites
-- Fresh Fruits — with their full menus. Data only, no schema changes.

-- MUTEBITES CHINESE (5 categories, 24 dishes) ---------------------------
with r as (
  insert into public.restaurants (name, phone, description, cuisine_tags, is_active)
  values ('MuteBites Chinese', '+918247075652', null, array['Noodles', 'Fried Rice', 'Manchurian'], true)
  returning id
),
c as (
  insert into public.dish_categories (restaurant_id, name, sort_order)
  select r.id, v.name, v.sort_order
  from r, (values
    ('Noodles', 0),
    ('Fried Rice', 1),
    ('Manchurian', 2),
    ('Starters', 3),
    ('Plate', 4)
  ) as v (name, sort_order)
  returning id, name
)
insert into public.dishes (restaurant_id, category_id, name, price, is_veg, note, sort_order)
select r.id, c.id, v.name, v.price, v.is_veg, v.note::text, v.sort_order
from r, (values
    ('Noodles', 'Veg Noodles', 90, true, null, 0),
    ('Noodles', 'Veg Manchurian Noodles', 100, true, null, 1),
    ('Noodles', 'Veg Paneer Noodles', 120, true, null, 2),
    ('Noodles', 'Egg Noodles', 110, false, null, 3),
    ('Noodles', 'Double Egg Noodles', 120, false, null, 4),
    ('Noodles', 'Egg Manchurian Noodles', 120, false, null, 5),
    ('Noodles', 'Egg Paneer Noodles', 130, false, null, 6),
    ('Noodles', 'Chicken Noodles', 120, false, null, 7),
    ('Noodles', 'Double Egg Chicken Noodles', 130, false, null, 8),
    ('Fried Rice', 'Veg Fried Rice', 90, true, null, 0),
    ('Fried Rice', 'Veg Manchurian Fried Rice', 100, true, null, 1),
    ('Fried Rice', 'Veg Paneer Fried Rice', 120, true, null, 2),
    ('Fried Rice', 'Egg Fried Rice', 110, false, null, 3),
    ('Fried Rice', 'Double Egg Fried Rice', 120, false, null, 4),
    ('Fried Rice', 'Egg Manchurian Fried Rice', 120, false, null, 5),
    ('Fried Rice', 'Egg Paneer Fried Rice', 130, false, null, 6),
    ('Fried Rice', 'Chicken Fried Rice', 120, false, null, 7),
    ('Fried Rice', 'Double Egg Chicken Fried Rice', 130, false, null, 8),
    ('Manchurian', 'Veg Manchurian', 90, true, null, 0),
    ('Manchurian', 'Egg Manchurian', 100, false, null, 1),
    ('Manchurian', 'Double Egg Manchurian', 110, false, null, 2),
    ('Starters', 'Chicken Manchurian', 180, false, null, 0),
    ('Starters', 'Chicken Chilli', 180, false, null, 1),
    ('Plate', '4P Chicken Lollipop', 160, false, null, 0)
) as v (category, name, price, is_veg, note, sort_order)
join c on c.name = v.category;

-- MUTEBITES FRESH FRUITS (1 category, 13 dishes) -------------------------
with r as (
  insert into public.restaurants (name, phone, description, cuisine_tags, is_active)
  values ('MuteBites Fresh Fruits', '+918247075652', 'Priced per pack — 500 g / 1 kg', array['Fresh Fruits'], true)
  returning id
),
c as (
  insert into public.dish_categories (restaurant_id, name, sort_order)
  select r.id, v.name, v.sort_order
  from r, (values
    ('Fresh Fruits', 0)
  ) as v (name, sort_order)
  returning id, name
)
insert into public.dishes (restaurant_id, category_id, name, price, is_veg, note, sort_order)
select r.id, c.id, v.name, v.price, v.is_veg, v.note::text, v.sort_order
from r, (values
    ('Fresh Fruits', 'Pomegranate (500 g)', 165, true, null, 0),
    ('Fresh Fruits', 'Pomegranate (1 kg)', 265, true, null, 1),
    ('Fresh Fruits', 'Apples (500 g)', 140, true, null, 2),
    ('Fresh Fruits', 'Apples (1 kg)', 265, true, null, 3),
    ('Fresh Fruits', 'Bananas (30 g)', 45, true, null, 4),
    ('Fresh Fruits', 'Bananas (1 kg)', 75, true, null, 5),
    ('Fresh Fruits', 'Guava (500 g)', 75, true, null, 6),
    ('Fresh Fruits', 'Guava (1 kg)', 135, true, null, 7),
    ('Fresh Fruits', 'Black Grapes (500 g)', 75, true, null, 8),
    ('Fresh Fruits', 'Black Grapes (1 kg)', 135, true, null, 9),
    ('Fresh Fruits', 'Dragon Fruit (500 g)', 95, true, null, 10),
    ('Fresh Fruits', 'Dragon Fruit (1 kg)', 175, true, null, 11),
    ('Fresh Fruits', 'Papaya (1 kg)', 75, true, null, 12)
) as v (category, name, price, is_veg, note, sort_order)
join c on c.name = v.category;
