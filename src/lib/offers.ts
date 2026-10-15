// Discount offers the admin switches on from the dashboard
// (app_settings.offer_pct10 / offer_pct20 / offer_biryani), for ONE
// restaurant (app_settings.offers_restaurant_id — Bheemasena, by decision
// 15 Oct 2026). A student picks at most one per order in the cart.
// public.place_order() is the real rule (it re-checks the offer is on, the
// restaurant and that the order qualifies, and computes the discount
// itself); this file mirrors it so the cart can show the numbers before the
// order is placed — change the two together. Ported from College Bites.
//
// Full and single biryanis are decided by MENU SECTION (Bheemasena names
// them "Chicken Fry Biryani" / "Single Fry Biryani", not "(Full)" /
// "(Single)"), the same section names place_order() checks. The server
// sends the matching dish ids (getOffers()), so the cart never guesses.

export type OfferKey = "pct10" | "pct20" | "biryani";

export const OFFER_KEYS: OfferKey[] = ["pct10", "pct20", "biryani"];

/** Sections whose dishes count as a full biryani / can be the free single. Same names as place_order(). */
export const FULL_BIRYANI_SECTIONS = ["Veg Biryani", "Non-Veg Biryani"];
export const SINGLE_BIRYANI_SECTION = "Single Biryani";

export const OFFERS: Record<OfferKey, { title: string; short: string; detail: string }> = {
  pct10: { title: "10% off", short: "10% off", detail: "On your whole order" },
  pct20: { title: "20% off", short: "20% off", detail: "On your whole order" },
  biryani: {
    title: "Buy 3 full biryanis, get 1 single free",
    short: "Free single biryani",
    detail: "Pick any single biryani for every 3 full ones",
  },
};

/** How many paid full biryanis earn one free single. */
export const FULLS_PER_FREE = 3;

/** A single biryani a student can pick for free. */
export type FreeChoice = {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
};

/** What the cart and order pages get from the server. */
export type OffersState = {
  active: OfferKey[];
  /** The one restaurant offers apply to, or null if none is set. */
  restaurantId: string | null;
  restaurantName: string;
  /** Dish ids of that restaurant's full biryanis (FULL_BIRYANI_SECTIONS). */
  fullDishIds: string[];
  /** Its single biryanis (SINGLE_BIRYANI_SECTION), while the biryani offer is on. */
  freeChoices: FreeChoice[];
};

export const NO_OFFERS: OffersState = {
  active: [],
  restaurantId: null,
  restaurantName: "",
  fullDishIds: [],
  freeChoices: [],
};

export function isOfferKey(value: unknown): value is OfferKey {
  return typeof value === "string" && (OFFER_KEYS as string[]).includes(value);
}

function fullCount(lines: { dishId: string; quantity: number }[], fullDishIds: string[]): number {
  return lines.reduce((n, l) => n + (fullDishIds.includes(l.dishId) ? l.quantity : 0), 0);
}

/** Free singles the cart has earned: one per 3 paid full biryanis. */
export function freeAllowance(lines: { dishId: string; quantity: number }[], fullDishIds: string[]): number {
  return Math.floor(fullCount(lines, fullDishIds) / FULLS_PER_FREE);
}

/** Full biryanis still needed for the next free single. */
export function fullsToNextFree(lines: { dishId: string; quantity: number }[], fullDishIds: string[]): number {
  return FULLS_PER_FREE - (fullCount(lines, fullDishIds) % FULLS_PER_FREE);
}

/** The discount in rupees, rounded like place_order() (Postgres round(): half away from zero). */
export function discountAmount(
  offer: OfferKey | null,
  itemsTotal: number,
  freeItems: { price: number; quantity: number }[] = [],
): number {
  if (offer === "pct10") return Math.round(itemsTotal * 0.1);
  if (offer === "pct20") return Math.round(itemsTotal * 0.2);
  if (offer === "biryani") return freeItems.reduce((n, f) => n + f.price * f.quantity, 0);
  return 0;
}
