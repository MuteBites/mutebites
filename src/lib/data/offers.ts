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
import { createClient } from "@/lib/supabase/server";

type BiryaniRow = {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
  dish_categories: { name: string } | null;
};

/**
 * Which discount offers are on (app_settings, public-read), the
 * restaurants switched off for 10% / 20% (offer_restaurant_exclusions,
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
    .select("offer_pct10, offer_pct20, offer_biryani, offers_restaurant_id, restaurants(name)")
    .eq("id", true)
    .single<{
      offer_pct10: boolean;
      offer_pct20: boolean;
      offer_biryani: boolean;
      offers_restaurant_id: string | null;
      restaurants: { name: string } | null;
    }>(),
    supabase.from("offer_restaurant_exclusions").select("offer, restaurant_id"),
  ]);
  if (error || !data) return NO_OFFERS;
  const excluded = Object.fromEntries(
    PERCENT_OFFER_KEYS.map((k) => [k, (exclusions ?? []).filter((e) => e.offer === k).map((e) => e.restaurant_id)]),
  ) as OffersState["excluded"];

  const flags: Record<OfferKey, boolean> = {
    pct10: data.offer_pct10,
    pct20: data.offer_pct20,
    biryani: data.offer_biryani,
  };
  const active = OFFER_KEYS.filter((k) => flags[k]);
  const restaurantId = data.offers_restaurant_id;
  // No biryani restaurant set: 10% / 20% still work everywhere.
  if (!restaurantId) return { ...NO_OFFERS, active: active.filter((k) => k !== "biryani"), excluded };

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

  return { active, excluded, restaurantId, restaurantName: data.restaurants?.name ?? "", fullDishIds, freeChoices };
});
