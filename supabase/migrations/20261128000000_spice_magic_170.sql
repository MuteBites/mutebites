-- Spice Magic's ₹170 offer (28 Nov 2026): Chicken Dum Full, Chicken Fry
-- Full and Chicken Mixed at ₹170 while this switch is on (Offers page).
-- Priced in the app (specialPrice(), src/lib/partners.ts) since its orders
-- go to FoodHub's WhatsApp, not place_order().
alter table public.deal_switches drop constraint deal_switches_key_check;
alter table public.deal_switches add constraint deal_switches_key_check
  check (key in ('a1_5','a1_10','shawarma_5','shawarma_11','bh_full_2','bh_full_5','bh_full_10','bh_mini_10','sm_5','sm_10','sm_170'));
insert into public.deal_switches (key) values ('sm_170') on conflict (key) do nothing;
