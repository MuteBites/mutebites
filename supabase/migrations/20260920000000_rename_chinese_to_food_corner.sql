-- Rename the Chinese kitchen to "Food Corner". "Chinese" goes into its
-- cuisine tags so Home search still finds it now that the name doesn't say so.
update public.restaurants
   set name = 'Food Corner',
       cuisine_tags = array['Chinese', 'Noodles', 'Fried Rice', 'Manchurian']
 where name = 'MuteBites Chinese';
