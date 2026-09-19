-- Remove Bismillah's two catch-all juice items. Past orders keep their
-- snapshotted name and price; order_items.dish_id (and any rating's
-- dish_id) just goes null, the same as any deleted dish.
delete from public.dishes d
using public.restaurants r
where d.restaurant_id = r.id
  and r.name = 'Bismillah Fruit Juice'
  and d.name in ('Bismillah Fruit Juice (Any Flavour)', 'Any Fruit Juice Bottle');
