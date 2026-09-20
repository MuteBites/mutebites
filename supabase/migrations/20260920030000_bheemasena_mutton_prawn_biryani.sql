-- Bheemasena: two new biryanis at the end of the Non-Veg Biryani section.
insert into public.dishes (restaurant_id, category_id, name, price, is_veg, note, sort_order)
select r.id, c.id, v.name, v.price, false, null, v.sort_order
  from public.restaurants r
  join public.dish_categories c
    on c.restaurant_id = r.id and c.name = 'Non-Veg Biryani'
 cross join (values
    ('Mutton Afghani Biryani', 400, 9),
    ('Prawn Biryani', 400, 10)
 ) as v (name, price, sort_order)
 where r.name = 'Bheemasena Restaurant';
