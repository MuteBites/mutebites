-- Bheemasena: 16 new dishes, appended to the end of four sections.
-- (The values list comes first so the joins can key off v.category.)
insert into public.dishes (restaurant_id, category_id, name, price, is_veg, note, sort_order)
select r.id, c.id, v.name, v.price, v.is_veg, v.note, v.sort_order
  from (values
    -- Non-Veg Biryani (after Prawn Biryani at 10)
    ('Non-Veg Biryani',  'Mutton Keema Biryani',      480, false, null, 11),
    ('Non-Veg Biryani',  'Mutton Mughlai Biryani',    430, false, null, 12),
    ('Non-Veg Biryani',  'Mutton Fry Biryani',        400, false, null, 13),
    ('Non-Veg Biryani',  'Chicken Wings Biryani',     320, false, null, 14),
    ('Non-Veg Biryani',  'Chicken Tandoori Biryani',  370, false, '2 pieces', 15),
    ('Non-Veg Biryani',  'Nawab Biryani',             370, false, null, 16),
    ('Non-Veg Biryani',  'Bheemasena Special Biryani',460, false,
       '2 chicken wings · boneless curry · sufficient for 2', 17),
    -- Non-Veg Starters (after Chicken Majestic at 3)
    ('Non-Veg Starters', 'Loose Prawns',              360, false, null, 4),
    ('Non-Veg Starters', 'Chilli Prawns',             370, false, null, 5),
    -- Veg Curries (after Kaju Paneer Butter Masala at 1)
    ('Veg Curries',      'Methi Chaman',              300, true,  null, 2),
    ('Veg Curries',      'Kaju Paneer Curry',         300, true,  null, 3),
    -- Non-Veg Curries (after Chicken Curry at 2)
    ('Non-Veg Curries',  'Punjabi Chicken',           310, false, null, 3),
    ('Non-Veg Curries',  'Hyderabadi Chicken',        290, false, null, 4),
    ('Non-Veg Curries',  'Kadai Chicken',             290, false, 'Spicy', 5),
    ('Non-Veg Curries',  'Chicken Tikka Masala',      300, false, null, 6),
    ('Non-Veg Curries',  'Mughlai Chicken Curry',     290, false, null, 7)
  ) as v (category, name, price, is_veg, note, sort_order)
  join public.restaurants r on r.name = 'Bheemasena Restaurant'
  join public.dish_categories c on c.restaurant_id = r.id and c.name = v.category;
