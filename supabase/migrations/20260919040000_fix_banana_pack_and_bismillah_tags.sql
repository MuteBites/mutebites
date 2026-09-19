-- Fresh Fruits: the banana pack was mislabelled "30 g"; it's 500 g.
update public.dishes d
   set name = 'Bananas (500 g)'
  from public.restaurants r
 where d.restaurant_id = r.id
   and r.name = 'MuteBites Fresh Fruits'
   and d.name = 'Bananas (30 g)';

-- Bismillah: drop the "Special" tag — its Special items were removed.
update public.restaurants
   set cuisine_tags = array['Fruit Juices', 'Sugarcane Juice']
 where name = 'Bismillah Fruit Juice';
