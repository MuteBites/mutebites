-- Spice Magic's deal (FoodHub's own, 27 Nov 2026): buy 5 biryanis → a Mini
-- Fry or Mini Dum Biryani free; buy 10 → a Chicken Starter or 2 Mini
-- Biryanis free. One admin switch for both (Offers → Restaurant deals),
-- off by default. Its orders go to FoodHub's WhatsApp, so the rule lives in
-- preparePartnerOrder(), not place_order().
alter table public.deal_switches drop constraint deal_switches_key_check;
alter table public.deal_switches add constraint deal_switches_key_check
  check (key in ('a1_5','a1_10','shawarma_5','shawarma_11','bh_full_2','bh_full_5','bh_full_10','bh_mini_10','sm_5','sm_10'));
insert into public.deal_switches (key) values ('sm_5'), ('sm_10') on conflict (key) do nothing;
