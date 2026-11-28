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
  /** Its WhatsApp group invite ("Join FoodHub" on the menu). */
  group: string;
};

export const FOODHUB: Partner = {
  brand: "FoodHub",
  whatsapp: "918464975652",
  url: "https://foodhub-vitap.vercel.app/",
  urlLabel: "foodhub-vitap.vercel.app",
  group: "https://chat.whatsapp.com/BCtFahx158W2ts4ogJlgDW",
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
/**
 * When a Spice Magic order counts as delivered on its tracking page (no
 * status is kept — the client's call): 8:00 PM IST on the day it was
 * placed, or an hour after it if it came in later than that.
 */
export function partnerDeliveredAt(createdAt: string): Date {
  const IST = 330 * 60_000;
  const placed = new Date(createdAt).getTime();
  const day = new Date(placed + IST);
  day.setUTCHours(20, 0, 0, 0);
  const due = day.getTime() - IST;
  return new Date(placed < due ? due : placed + 60 * 60_000);
}

/**
 * FoodHub's WhatsApp link for an order: "<restaurant> order", the
 * student's phone number, then each dish with its quantity, nothing else
 * (the client's call, 28 Nov 2026).
 */
export function partnerWhatsAppUrl(
  partner: Partner,
  restaurantName: string,
  phoneLine: string,
  items: { name: string; quantity: number }[],
): string {
  const text = [`${restaurantName} order`, phoneLine, ...items.map((i) => `${i.name} - ${i.quantity}`)].join("\n");
  return `https://wa.me/${partner.whatsapp}?text=${encodeURIComponent(text)}`;
}

/**
 * Spice Magic's ₹170 offer (28 Nov 2026): while its admin switch is on
 * (deal_switches key "sm_170", Offers page), these full biryanis cost ₹170.
 * The menu, Home search and preparePartnerOrder() all price through
 * specialPrice(). Matched by name.
 */
export const SPECIAL_PRICE = {
  key: "sm_170",
  restaurant: "Spice Magic",
  price: 170,
  dishes: ["Chicken Dum Full", "Chicken Fry Full", "Chicken Mixed"],
  title: "Chicken Dum, Fry & Mixed (full) at ₹170",
  /** Today only (the client's call): off by itself from midnight IST. */
  until: "2026-11-29T00:00:00+05:30",
} as const;

/** The switch is on and the day isn't over. */
export function specialPriceLive(switchOn: boolean, now: number = Date.now()): boolean {
  return switchOn && now < Date.parse(SPECIAL_PRICE.until);
}

export function specialPrice(restaurantName: string, dishName: string, price: number, on: boolean): number {
  return on && restaurantName === SPECIAL_PRICE.restaurant && (SPECIAL_PRICE.dishes as readonly string[]).includes(dishName)
    ? Math.min(price, SPECIAL_PRICE.price)
    : price;
}

export type PartnerOrder = {
  id: string;
  restaurantName: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  notes: string | null;
  createdAt: string;
};
