-- Bheemasena: Single Mushroom Biryani 220 → 200.
update public.dishes d
   set price = 200
  from public.restaurants r
 where d.restaurant_id = r.id
   and r.name = 'Bheemasena Restaurant'
   and d.name = 'Single Mushroom Biryani';
