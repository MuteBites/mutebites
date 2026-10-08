-- Data only — an eighth restaurant, Waffle Pops (and company): 65 dishes in
-- 8 sections. Every price is the printed menu price + ₹10 (client's
-- instruction). Waffle pops and mini pancakes carry "Pop" / "Mini Pancakes"
-- in their names so they never read the same as a waffle of the same flavour
-- on a cart line or admin card. Printed typos fixed ("Fugde", "Mdness").
-- Extra add-ons (choco chip, ice cream, …) aren't items: the app has no
-- add-on system.

with r as (
  insert into public.restaurants (name, phone, description, cuisine_tags, is_active)
  values ('Waffle Pops', '+918247075652', 'Waffles, waffle pops, brownies and hot chocolate',
          array['Waffles', 'Desserts', 'Brownies'], true)
  returning id
),
c as (
  insert into public.dish_categories (restaurant_id, name, sort_order)
  select r.id, v.name, v.sort_order
  from r, (values
    ('Waffle Pops', 0),
    ('Classic Waffles', 1),
    ('Red Velvet Love', 2),
    ('KitKat Club', 3),
    ('Chocolate Love', 4),
    ('Mini Pancakes', 5),
    ('Brownies', 6),
    ('Hot Chocolate', 7)
  ) as v (name, sort_order)
  returning id, name
)
insert into public.dishes (restaurant_id, category_id, name, price, is_veg, note, sort_order)
select r.id, c.id, v.name, v.price, v.is_veg, v.note::text, v.sort_order
from (values
    ('Waffle Pops', 'Trio of Chocolate Pop', 99, true, 'Dark chocolate dip, milk & white chocolate on top', 0),
    ('Waffle Pops', 'Choco Crunch Pop', 119, true, 'Milk chocolate dip, topped with almonds', 1),
    ('Waffle Pops', 'Dark Chocolate Pop', 99, true, 'Dark chocolate dip, milk chocolate drizzle', 2),
    ('Waffle Pops', 'Milk Chocolate Pop', 99, true, 'Milk chocolate dip, dark chocolate drizzle', 3),
    ('Waffle Pops', 'White Chocolate Pop', 109, true, 'White chocolate dip, dark chocolate drizzle', 4),
    ('Waffle Pops', 'Double Chocolate Delight Pop', 99, true, 'Dark & milk chocolate, chocolate syrup', 5),
    ('Waffle Pops', 'Dark & White Madness Pop', 99, true, 'Dark + white chocolate drizzle, chocolate syrup', 6),
    ('Waffle Pops', 'Cookies & Cream Pop', 109, true, 'Milk & white chocolate, chopped Oreos', 7),
    ('Waffle Pops', 'KitKat Pop', 109, true, 'White chocolate dip, chopped KitKat', 8),
    ('Waffle Pops', 'Oreo Pop', 109, true, 'White chocolate dip, milk chocolate drizzle, Oreos', 9),
    ('Waffle Pops', 'Nutella Pop', 139, true, 'Nutella, dark chocolate drizzle', 10),
    ('Waffle Pops', 'Snickers Pop', 119, true, 'Dark & milk chocolate, chopped Snickers', 11),
    ('Waffle Pops', 'Red Velvet Pop', 119, true, 'Red velvet waffle in Belgian white chocolate', 12),
    ('Classic Waffles', 'Belgian Dark Chocolate', 139, true, null, 0),
    ('Classic Waffles', 'Belgian Milk Chocolate', 139, true, null, 1),
    ('Classic Waffles', 'Belgian White Chocolate', 139, true, null, 2),
    ('Classic Waffles', 'Caramel White Chocolate', 139, true, null, 3),
    ('Classic Waffles', 'Choco Almond', 169, true, null, 4),
    ('Classic Waffles', 'Trio of Chocolate', 129, true, null, 5),
    ('Classic Waffles', 'Nutella', 179, true, null, 6),
    ('Classic Waffles', 'KitKat', 149, true, null, 7),
    ('Classic Waffles', 'Oreo', 149, true, null, 8),
    ('Classic Waffles', 'Butterscotch', 139, true, null, 9),
    ('Classic Waffles', 'Choco Hazelnut', 149, true, null, 10),
    ('Classic Waffles', 'Dark & White Madness', 139, true, null, 11),
    ('Classic Waffles', 'Mocha', 139, true, null, 12),
    ('Classic Waffles', 'Lotus Biscoff', 169, true, null, 13),
    ('Classic Waffles', 'Nutella Oreo Crunch', 189, true, null, 14),
    ('Red Velvet Love', 'Red Velvet White Chocolate', 149, true, null, 0),
    ('Red Velvet Love', 'Red Velvet Dark Chocolate', 149, true, null, 1),
    ('Red Velvet Love', 'Red Velvet Double Chocolate', 149, true, 'Dark & white chocolate', 2),
    ('KitKat Club', 'KitKat White Chocolate', 149, true, null, 0),
    ('KitKat Club', 'KitKat Dark Chocolate', 149, true, null, 1),
    ('KitKat Club', 'KitKat Double Chocolate', 149, true, null, 2),
    ('KitKat Club', 'Caramel KitKat', 159, true, null, 3),
    ('KitKat Club', 'KitKat Oreo White Chocolate', 159, true, null, 4),
    ('KitKat Club', 'KitKat Oreo Dark Chocolate', 159, true, null, 5),
    ('Chocolate Love', 'Dark & White', 149, true, null, 0),
    ('Chocolate Love', 'Dark & Milk', 149, true, null, 1),
    ('Chocolate Love', 'Dark Knight', 149, true, null, 2),
    ('Chocolate Love', 'White Dream', 149, true, null, 3),
    ('Chocolate Love', 'Midnight Madness', 159, true, null, 4),
    ('Chocolate Love', 'Choco Devil', 159, true, null, 5),
    ('Chocolate Love', 'Dubai Pistachio Kunafa', 199, true, null, 6),
    ('Mini Pancakes', 'White Chocolate Mini Pancakes', 159, true, null, 0),
    ('Mini Pancakes', 'Triple Chocolate Mini Pancakes', 159, true, null, 1),
    ('Mini Pancakes', 'Double Chocolate Mini Pancakes', 159, true, null, 2),
    ('Mini Pancakes', 'Choco Nutella Mini Pancakes', 179, true, null, 3),
    ('Mini Pancakes', 'Lotus Biscoff Mini Pancakes', 179, true, null, 4),
    ('Mini Pancakes', 'KitKat Double Chocolate Mini Pancakes', 169, true, null, 5),
    ('Mini Pancakes', 'Choco Almond Mini Pancakes', 169, true, null, 6),
    ('Mini Pancakes', 'Oreo White Chocolate Mini Pancakes', 169, true, null, 7),
    ('Brownies', 'Classic Fudge Brownie', 109, true, null, 0),
    ('Brownies', 'Triple Choco Brownie', 129, true, null, 1),
    ('Brownies', 'KitKat Oreo Brownie', 149, true, null, 2),
    ('Brownies', 'Dark Choco Brownie', 129, true, null, 3),
    ('Brownies', 'Chocochip Brownie', 139, true, null, 4),
    ('Brownies', 'Nuts Overload Brownie', 149, true, null, 5),
    ('Brownies', 'Biscoff Brownie', 159, true, null, 6),
    ('Brownies', 'Caramel Brownie', 149, true, null, 7),
    ('Brownies', 'Pistachio Kunafa Brownie', 159, true, null, 8),
    ('Brownies', 'Hazelnut Brownie', 159, true, null, 9),
    ('Hot Chocolate', 'Classic Hot Chocolate', 129, true, null, 0),
    ('Hot Chocolate', 'Hazelnut Hot Chocolate', 139, true, null, 1),
    ('Hot Chocolate', 'Caramel Hot Chocolate', 139, true, null, 2)
) as v (category, name, price, is_veg, note, sort_order)
join c on c.name = v.category
cross join r;
