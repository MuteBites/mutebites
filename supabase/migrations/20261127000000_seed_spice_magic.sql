-- Spice Magic: a MuteBites x FoodHub collab (27 Nov 2026). Its menu lives
-- here (MuteBites' admin keeps it and switches it on in Kitchen), but orders
-- never go through place_order(): the cart opens FoodHub's WhatsApp with the
-- order typed out. The app knows it by name (src/lib/partners.ts). Starts
-- switched off. Menu copied from FoodHub's seed.
with r as (
  insert into public.restaurants (name, phone, description, cuisine_tags, is_active)
  values ('Spice Magic', '+918464975652', 'Authentic taste, rich flavour, always fresh. Delivered by FoodHub.', array['Biryani', 'Combos'], false)
  returning id
),
c as (
  insert into public.dish_categories (restaurant_id, name, sort_order)
  select r.id, v.name, v.sort_order
  from r, (values ('Biryanis', 0), ('Combo Packs', 1), ('Family Pack Buckets', 2)) as v (name, sort_order)
  returning id, name
)
insert into public.dishes (restaurant_id, category_id, name, price, is_veg, note, sort_order, is_available)
select r.id, c.id, v.name, v.price, false, v.note::text, v.sort_order, v.avail
from r, (values
    ('Biryanis', 'Chicken Dum Mini', 130, null, 0, true),
    ('Biryanis', 'Chicken Fry Mini', 150, null, 1, true),
    ('Biryanis', 'Chicken Dum Full', 190, null, 2, true),
    ('Biryanis', 'Chicken Fry Full', 210, null, 3, true),
    ('Biryanis', 'Chicken Mixed', 210, null, 4, true),
    ('Biryanis', 'Chicken Moghlai Biryani', 260, null, 5, true),
    ('Biryanis', 'Chicken 65 Biryani', 260, null, 6, true),
    ('Biryanis', 'Balayya Babu Biryani', 260, 'Evening special', 7, false),
    ('Combo Packs', 'Chicken Dum Combo Pack', 300, 'Dum biryani + lollipop + Thums Up peg bottle', 0, true),
    ('Combo Packs', 'Chicken Fry Combo Pack', 300, 'Fry biryani + chilli wings + Thums Up peg bottle', 1, true),
    ('Combo Packs', 'Chicken Mixed Combo Pack', 300, 'Mixed biryani + chicken wings + Thums Up peg bottle', 2, true),
    ('Family Pack Buckets', 'Chicken Dum Bucket', 600, null, 0, true),
    ('Family Pack Buckets', 'Chicken Fry Bucket', 650, null, 1, true),
    ('Family Pack Buckets', 'Chicken Mixed Bucket', 700, null, 2, true)
) as v (cat, name, price, note, sort_order, avail)
join c on c.name = v.cat;
