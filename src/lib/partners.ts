/**
 * Partner restaurants (27 Nov 2026): a restaurant another brand runs, shown
 * inside MuteBites. Today that's Spice Magic, a MuteBites x FoodHub collab.
 * Its menu lives in MuteBites (the admin keeps it and switches it on in
 * Kitchen), but MuteBites takes no order for it: the cart opens FoodHub's
 * WhatsApp with the order typed out and a verify link, and FoodHub takes it
 * from there. Nothing is saved, no token, no MuteBites offers or deals, no
 * delivery batches. Matched by name: renaming the restaurant breaks this
 * until the name here is updated too. Client-safe.
 */
export type Partner = {
  brand: string;
  /** wa.me number: country code, no plus. */
  whatsapp: string;
  url: string;
  urlLabel: string;
};

export const FOODHUB: Partner = {
  brand: "FoodHub",
  whatsapp: "918464975652",
  url: "https://foodhub.in",
  urlLabel: "foodhub.in",
};

const PARTNERS: Record<string, Partner> = {
  "Spice Magic": FOODHUB,
};

export const PARTNER_NAMES = Object.keys(PARTNERS);

export function partnerOf(restaurantName: string | null | undefined): Partner | null {
  return (restaurantName && PARTNERS[restaurantName]) || null;
}

export function isPartnerRestaurant(restaurantName: string | null | undefined) {
  return partnerOf(restaurantName) !== null;
}

/** Caps per WhatsApp order, so a prank can't be a 40-biryani one. */
export const PARTNER_MAX_ITEMS = 15;
export const PARTNER_MAX_TOTAL = 3000;
/** How long a verify link stays valid. */
export const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

/** What a verify link carries (signed, so it can't be edited). */
export type PartnerOrderPayload = {
  v: 1;
  /** Restaurant name. */
  r: string;
  /** Items: [name, quantity, unit price]. */
  i: [string, number, number][];
  /** Total. */
  t: number;
  /** Student's name and phone. */
  n: string;
  p: string;
  /** Note (may be empty). */
  o: string;
  /** Sent at, ms. */
  s: number;
};
