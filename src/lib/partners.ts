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
  url: "https://foodhub-vitap.vercel.app/",
  urlLabel: "foodhub-vitap.vercel.app",
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
 * FoodHub's WhatsApp link for an order: the student's phone number, then
 * each dish with its quantity, nothing else (the client's call).
 */
export function partnerWhatsAppUrl(
  partner: Partner,
  phoneLine: string,
  items: { name: string; quantity: number }[],
): string {
  const text = [phoneLine, ...items.map((i) => `${i.name} - ${i.quantity}`)].join("\n");
  return `https://wa.me/${partner.whatsapp}?text=${encodeURIComponent(text)}`;
}

export type PartnerOrder = {
  id: string;
  restaurantName: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  notes: string | null;
  createdAt: string;
};
