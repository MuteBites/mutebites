-- Every mixed biryani comes with both dum and fry pieces.
update public.dishes
   set note = 'Comes with both dum & fry pieces'
 where name ilike '%mixed biryani%';
