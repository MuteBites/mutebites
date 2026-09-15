-- Seed: the 3 real partner restaurants and their full menus.
-- Data only, no schema changes. Refuses to run if any restaurant already
-- exists, so it can't create duplicates if pasted twice.

do $$
begin
  if exists (select 1 from public.restaurants) then
    raise exception 'restaurants table is not empty - seed already applied?';
  end if;
end;
$$;

-- BHEEMASENA RESTAURANT (9 categories, 41 dishes) -------------------
with r as (
  insert into public.restaurants (name, phone, description, cuisine_tags, is_active)
  values ('Bheemasena Restaurant', '+918247075652', null, array['Biryani', 'Starters', 'Curries'], true)
  returning id
),
c as (
  insert into public.dish_categories (restaurant_id, name, sort_order)
  select r.id, v.name, v.sort_order
  from r, (values
    ('Veg Starters', 0),
    ('Non-Veg Starters', 1),
    ('Veg Biryani', 2),
    ('Non-Veg Biryani', 3),
    ('Single Biryani', 4),
    ('Breads', 5),
    ('Veg Curries', 6),
    ('Non-Veg Curries', 7),
    ('Tandoori', 8)
  ) as v (name, sort_order)
  returning id, name
)
insert into public.dishes (restaurant_id, category_id, name, price, is_veg, note, sort_order)
select r.id, c.id, v.name, v.price, v.is_veg, v.note::text, v.sort_order
from r, (values
    ('Veg Starters', 'Veg Manchuria', 210, true, null, 0),
    ('Veg Starters', 'Chilli Mushroom', 230, true, null, 1),
    ('Veg Starters', 'Crispy Baby Corn', 230, true, null, 2),
    ('Veg Starters', 'Paneer 65', 280, true, null, 3),
    ('Veg Starters', 'Paneer Majestic', 290, true, null, 4),
    ('Non-Veg Starters', 'Chilli Chicken', 290, false, null, 0),
    ('Non-Veg Starters', 'Chicken Manchuria', 290, false, null, 1),
    ('Non-Veg Starters', 'Chicken 65', 290, false, null, 2),
    ('Non-Veg Starters', 'Chicken Majestic', 290, false, null, 3),
    ('Veg Biryani', 'Special Paneer Biryani', 290, true, null, 0),
    ('Veg Biryani', 'Special Mushroom Biryani', 290, true, null, 1),
    ('Veg Biryani', 'Special Veg Biryani', 260, true, null, 2),
    ('Veg Biryani', 'Ulavacharu Biryani', 270, true, null, 3),
    ('Veg Biryani', 'Kaju Biryani', 290, true, null, 4),
    ('Veg Biryani', 'Special Kaju Biryani', 310, true, null, 5),
    ('Non-Veg Biryani', 'Special Egg Biryani', 280, false, null, 0),
    ('Non-Veg Biryani', 'Chicken Dum Biryani', 270, false, null, 1),
    ('Non-Veg Biryani', 'Kundan Biryani', 360, false, null, 2),
    ('Non-Veg Biryani', 'Chicken Fry Biryani', 280, false, null, 3),
    ('Non-Veg Biryani', 'Special Chicken Biryani', 300, false, null, 4),
    ('Non-Veg Biryani', 'Joint Biryani', 310, false, null, 5),
    ('Non-Veg Biryani', 'Chicken Mughlai Biryani', 330, false, null, 6),
    ('Non-Veg Biryani', 'Chicken Lollipop Biryani', 330, false, null, 7),
    ('Non-Veg Biryani', 'Gongura Chicken Fry Biryani', 320, false, 'Thursday Only', 8),
    ('Single Biryani', 'Single Dum Biryani', 190, false, null, 0),
    ('Single Biryani', 'Single Fry Biryani', 200, false, null, 1),
    ('Single Biryani', 'Single Special Chicken Biryani', 220, false, null, 2),
    ('Single Biryani', 'Single Paneer Biryani', 200, true, null, 3),
    ('Single Biryani', 'Single Mushroom Biryani', 220, true, null, 4),
    ('Single Biryani', 'Single Mughlai Biryani', 220, false, null, 5),
    ('Single Biryani', 'Single Gongura Biryani', 230, false, 'Thursday Only', 6),
    ('Single Biryani', 'Mixed Biryani', 220, false, null, 7),
    ('Breads', 'Butter Naan', 45, true, null, 0),
    ('Breads', 'Roti', 25, true, null, 1),
    ('Veg Curries', 'Paneer Butter Masala', 280, true, null, 0),
    ('Veg Curries', 'Kaju Paneer Butter Masala', 300, true, null, 1),
    ('Non-Veg Curries', 'Egg Burji', 190, false, null, 0),
    ('Non-Veg Curries', 'Butter Chicken', 290, false, null, 1),
    ('Non-Veg Curries', 'Chicken Curry', 270, false, null, 2),
    ('Tandoori', 'Chicken Tandoori Half', 300, false, null, 0),
    ('Tandoori', 'Chicken Tandoori Full', 580, false, null, 1)
) as v (category, name, price, is_veg, note, sort_order)
join c on c.name = v.category;

-- A1 BIRYANI POINT (1 category, 3 dishes) ----------------------------
with r as (
  insert into public.restaurants (name, phone, description, cuisine_tags, is_active)
  values ('A1 Biryani Point', '+918247075652', '1000ml box, sufficient for one person', array['Biryani Specials'], true)
  returning id
),
c as (
  insert into public.dish_categories (restaurant_id, name, sort_order)
  select r.id, v.name, v.sort_order
  from r, (values
    ('Biryani Specials', 0)
  ) as v (name, sort_order)
  returning id, name
)
insert into public.dishes (restaurant_id, category_id, name, price, is_veg, note, sort_order)
select r.id, c.id, v.name, v.price, v.is_veg, v.note::text, v.sort_order
from r, (values
    ('Biryani Specials', 'A1 Biryani Dum Biryani', 190, false, null, 0),
    ('Biryani Specials', 'A1 Biryani Fry Pieces Biryani', 200, false, null, 1),
    ('Biryani Specials', 'A1 Biryani Mixed Biryani', 210, false, null, 2)
) as v (category, name, price, is_veg, note, sort_order)
join c on c.name = v.category;

-- BISMILLAH FRUIT JUICE (2 categories, 14 dishes) -------------------
with r as (
  insert into public.restaurants (name, phone, description, cuisine_tags, is_active)
  values ('Bismillah Fruit Juice', '+918247075652', '100% Natural, No Added Colours, Made for VIT-AP Students', array['Fruit Juices', 'Sugarcane Juice', 'Special'], true)
  returning id
),
c as (
  insert into public.dish_categories (restaurant_id, name, sort_order)
  select r.id, v.name, v.sort_order
  from r, (values
    ('Fruit Juices', 0),
    ('Sugarcane Juice', 1)
  ) as v (name, sort_order)
  returning id, name
)
insert into public.dishes (restaurant_id, category_id, name, price, is_veg, note, sort_order)
select r.id, c.id, v.name, v.price, v.is_veg, v.note::text, v.sort_order
from r, (values
    ('Fruit Juices', 'Carrot Juice', 80, true, null, 0),
    ('Fruit Juices', 'Beetroot Juice', 80, true, null, 1),
    ('Fruit Juices', 'Pineapple Juice', 80, true, null, 2),
    ('Fruit Juices', 'Grape Juice', 80, true, null, 3),
    ('Fruit Juices', 'Pomegranate Juice', 80, true, null, 4),
    ('Fruit Juices', 'Apple Juice', 80, true, null, 5),
    ('Fruit Juices', 'Muskmelon Juice', 80, true, null, 6),
    ('Fruit Juices', 'Watermelon Juice', 80, true, null, 7),
    ('Fruit Juices', 'Banana Juice', 80, true, null, 8),
    ('Fruit Juices', 'Sweet Lemon Juice (Mosambi)', 80, true, null, 9),
    ('Fruit Juices', 'Any Fruit Juice Bottle', 130, true, null, 10),
    ('Fruit Juices', 'Bismillah Fruit Juice (Any Flavour)', 80, true, null, 11),
    ('Sugarcane Juice', 'Sugarcane Juice (Glass)', 40, true, null, 0),
    ('Sugarcane Juice', 'Sugarcane Juice (1 Bottle)', 80, true, null, 1)
) as v (category, name, price, is_veg, note, sort_order)
join c on c.name = v.category;
