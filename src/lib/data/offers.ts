import "server-only";

import { cache } from "react";
import {
  FULL_BIRYANI_SECTIONS,
  NO_OFFERS,
  OFFER_KEYS,
  PERCENT_OFFER_KEYS,
  SINGLE_BIRYANI_SECTION,
  type OfferKey,
  type OffersState,
} from "@/lib/offers";
import { DEALS, isDealKey, type DealGroup, type DealsState } from "@/lib/deals";
import { createClient } from "@/lib/supabase/server";

type DealDishRow = {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
  restaurants: { name: string };
  dish_categories: { name: string } | null;
};

/** Which deals are on, and which dishes count towards them (same rule as place_order()). */
async function getDeals(supabase: Awaited<ReturnType<typeof createClient>>): Promise<DealsState> {
  const { data: switches } = await supabase.from("deal_switches").select("key, enabled");
  const on = (switches ?? []).filter((s) => s.enabled && isDealKey(s.key)).map((s) => s.key as DealsState["on"][number]);
  if (on.length === 0) return { on, groups: {}, miniOptions: [] };
  const names = [...new Set(DEALS.filter((d) => on.includes(d.key)).map((d) => d.restaurant))];
  const { data } = await supabase
    .from("dishes")
    .select("id, name, price, is_available, restaurants!inner(name), dish_categories(name)")
    .in("restaurants.name", names)
    .order("price")
    .order("name")
    .returns<DealDishRow[]>();
  const groups: Record<string, DealGroup> = {};
  const miniOptions: string[] = [];
  for (const d of data ?? []) {
    const r = d.restaurants.name;
    const section = d.dish_categories?.name ?? "";
    let g: DealGroup | null = null;
    if (r === "A1 Biryani Point" && section === "Biryani Specials") g = "a1";
    else if (r === "Shawarma Hub" && d.name === "Chicken Shawarma") g = "shawarma";
    else if (r === "Bheemasena Restaurant" && FULL_BIRYANI_SECTIONS.includes(section)) g = "bh_full";
    else if (r === "Bheemasena Restaurant" && section === SINGLE_BIRYANI_SECTION) g = "bh_mini";
    if (g) groups[d.id] = g;
    if (g === "bh_mini" && d.is_available) miniOptions.push(d.name);
  }
  return { on, groups, miniOptions };
}

type BiryaniRow = {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
  dish_categories: { name: string } | null;
};

/**
 * Which discount offers are on (app_settings, public-read), the
 * restaurants switched off for 5% / 10% / 20% (offer_restaurant_exclusions,
 * public-read), the biryani offer's restaurant, and that restaurant's full biryani ids and (while the
 * biryani offer is on) its single biryanis to pick free — by menu section,
 * the same rule place_order() uses. Only drives the cart and admin;
 * place_order() re-checks everything. Errors read as "no offers" so no
 * page breaks over it. Cached per request. Ported from College Bites.
 */
export const getOffers = cache(async (): Promise<OffersState> => {
  const supabase = await createClient();
  const [{ data, error }, { data: exclusions }] = await Promise.all([
    supabase
    .from("app_settings")
    .select("offer_pct5, offer_pct10, offer_pct20, offer_biryani, offers_restaurant_id, restaurants(name)")
    .eq("id", true)
    .single<{
      offer_pct5: boolean;
      offer_pct10: boolean;
      offer_pct20: boolean;
      offer_biryani: boolean;
      offers_restaurant_id: string | null;
      restaurants: { name: string } | null;
    }>(),
    supabase.from("offer_restaurant_exclusions").select("offer, restaurant_id"),
  ]);
  const deals = await getDeals(supabase);
  if (error || !data) return { ...NO_OFFERS, deals };
  const excluded = Object.fromEntries(
    PERCENT_OFFER_KEYS.map((k) => [k, (exclusions ?? []).filter((e) => e.offer === k).map((e) => e.restaurant_id)]),
  ) as OffersState["excluded"];

  const flags: Record<OfferKey, boolean> = {
    pct5: data.offer_pct5,
    pct10: data.offer_pct10,
    pct20: data.offer_pct20,
    biryani: data.offer_biryani,
  };
  const active = OFFER_KEYS.filter((k) => flags[k]);
  const restaurantId = data.offers_restaurant_id;
  // No biryani restaurant set: 5% / 10% / 20% still work everywhere.
  if (!restaurantId) return { ...NO_OFFERS, active: active.filter((k) => k !== "biryani"), excluded, deals };

  let fullDishIds: string[] = [];
  let freeChoices: OffersState["freeChoices"] = [];
  if (flags.biryani) {
    const { data: dishes } = await supabase
      .from("dishes")
      .select("id, name, price, is_available, dish_categories!inner(name)")
      .eq("restaurant_id", restaurantId)
      .in("dish_categories.name", [...FULL_BIRYANI_SECTIONS, SINGLE_BIRYANI_SECTION])
      .order("price")
      .order("name")
      .returns<BiryaniRow[]>();
    const rows = dishes ?? [];
    fullDishIds = rows.filter((d) => FULL_BIRYANI_SECTIONS.includes(d.dish_categories?.name ?? "")).map((d) => d.id);
    freeChoices = rows
      .filter((d) => d.dish_categories?.name === SINGLE_BIRYANI_SECTION)
      .map((d) => ({ id: d.id, name: d.name, price: Number(d.price), isAvailable: d.is_available }));
  }

  return { active, excluded, restaurantId, restaurantName: data.restaurants?.name ?? "", fullDishIds, freeChoices, deals };
});
