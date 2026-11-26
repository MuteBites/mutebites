// Restaurant deals (26 Nov 2026): applied automatically in the cart, each
// with an admin switch on the Offers page (public.deal_switches). The real
// rule is public.place_order() (20261126000000_restaurant_deals.sql) — it
// counts the cart, picks the deals and writes orders.deals / deal_amount.
// This file mirrors it so the cart can show them first; change the two
// together. Per group only the biggest deal reached (and switched on)
// applies, once per order; deals combine with the discount the student
// picks. Gifts come with the order; only Shawarma Hub's are money off.

export type DealKey =
  | "a1_5"
  | "a1_10"
  | "shawarma_5"
  | "shawarma_11"
  | "bh_full_2"
  | "bh_full_5"
  | "bh_full_10"
  | "bh_mini_10";

/** What a cart dish counts towards (decided on the server by restaurant + section / name). */
export type DealGroup = "a1" | "shawarma" | "bh_full" | "bh_mini";

type DealDef = {
  key: DealKey;
  group: DealGroup;
  min: number;
  restaurant: string;
  /** The admin's switch label. */
  title: string;
  /** What the counted dishes are called in "Add N more …". */
  unit: string;
  off: number;
  /** A gift the student picks: how many, and from what ("mini" = the restaurant's single biryanis). */
  choose?: { count: number; options: string[] | "mini" };
};

/** Biggest first within each group, the order place_order() checks them. */
export const DEALS: DealDef[] = [
  { key: "a1_10", group: "a1", min: 10, restaurant: "A1 Biryani Point", title: "Buy 10 biryanis, get a Chicken 65 Biryani (full) free", unit: "biryanis", off: 0 },
  { key: "a1_5", group: "a1", min: 5, restaurant: "A1 Biryani Point", title: "Buy 5 biryanis, get a 1 litre Thums Up free", unit: "biryanis", off: 0 },
  { key: "shawarma_11", group: "shawarma", min: 11, restaurant: "Shawarma Hub", title: "11 Chicken Shawarmas, ₹210 off", unit: "Chicken Shawarmas", off: 210 },
  { key: "shawarma_5", group: "shawarma", min: 5, restaurant: "Shawarma Hub", title: "5 Chicken Shawarmas, ₹50 off", unit: "Chicken Shawarmas", off: 50 },
  { key: "bh_full_10", group: "bh_full", min: 10, restaurant: "Bheemasena Restaurant", title: "Buy 10 full biryanis, get any 2 mini biryanis free", unit: "full biryanis", off: 0, choose: { count: 2, options: "mini" } },
  { key: "bh_full_5", group: "bh_full", min: 5, restaurant: "Bheemasena Restaurant", title: "Buy 5 full biryanis, get Chicken Curry or Half Chicken 65 free", unit: "full biryanis", off: 0, choose: { count: 1, options: ["Chicken Curry", "Half Chicken 65"] } },
  { key: "bh_full_2", group: "bh_full", min: 2, restaurant: "Bheemasena Restaurant", title: "Buy 2 full biryanis, get a Thums Up (pet bottle) free", unit: "full biryanis", off: 0 },
  { key: "bh_mini_10", group: "bh_mini", min: 10, restaurant: "Bheemasena Restaurant", title: "Buy 10 mini biryanis, get a Chicken Fry Biryani (full) free", unit: "mini biryanis", off: 0 },
];

export const DEAL_KEYS = DEALS.map((d) => d.key);

export function isDealKey(v: unknown): v is DealKey {
  return typeof v === "string" && (DEAL_KEYS as string[]).includes(v);
}

/** What the cart gets from the server. */
export type DealsState = {
  on: DealKey[];
  /** Dish id → the group it counts towards (only dishes that count). */
  groups: Record<string, DealGroup>;
  /** Bheemasena's available mini (Single Biryani) names, cheapest first. */
  miniOptions: string[];
};

export const NO_DEALS: DealsState = { on: [], groups: {}, miniOptions: [] };

export type AppliedDeal = { key: DealKey; label: string; off: number; choose?: { count: number; options: string[] } };

/** A deal one step away, to nudge: "Add 2 more Chicken Shawarmas for ₹50 off". */
export type NextDeal = { key: DealKey; more: number; text: string };

export function dealOptions(def: DealDef, deals: DealsState): string[] {
  if (!def.choose) return [];
  return def.choose.options === "mini" ? deals.miniOptions : def.choose.options;
}

/** The label place_order() writes, for the picks given (defaults like it does). */
function labelFor(def: DealDef, deals: DealsState, picks: string[] | undefined): string {
  switch (def.key) {
    case "a1_10":
      return "Free Chicken 65 Biryani (full)";
    case "a1_5":
      return "Free 1 litre Thums Up";
    case "shawarma_11":
      return "₹210 off on 11 Chicken Shawarmas";
    case "shawarma_5":
      return "₹50 off on 5 Chicken Shawarmas";
    case "bh_full_2":
      return "Free Thums Up (pet bottle)";
    case "bh_mini_10":
      return "Free Chicken Fry Biryani (full)";
    case "bh_full_5": {
      const opts = dealOptions(def, deals);
      return `Free ${picks?.[0] && opts.includes(picks[0]) ? picks[0] : "Chicken Curry"}`;
    }
    case "bh_full_10": {
      const opts = dealOptions(def, deals);
      if (opts.length === 0) return "Free 2 mini biryanis";
      const a = picks?.[0] && opts.includes(picks[0]) ? picks[0] : opts[0];
      const b = picks?.[1] && opts.includes(picks[1]) ? picks[1] : a;
      return a === b ? `Free mini biryanis: ${a} × 2` : `Free mini biryanis: ${a} + ${b}`;
    }
  }
}

/** The deals this cart earns, and the closest one it could still reach. */
export function cartDeals(
  lines: { dishId: string; quantity: number }[],
  deals: DealsState,
  picks: Partial<Record<DealKey, string[]>> = {},
): { applied: AppliedDeal[]; next: NextDeal | null } {
  const counts: Record<DealGroup, number> = { a1: 0, shawarma: 0, bh_full: 0, bh_mini: 0 };
  for (const l of lines) {
    const g = deals.groups[l.dishId];
    if (g) counts[g] += l.quantity;
  }
  const applied: AppliedDeal[] = [];
  let next: NextDeal | null = null;
  for (const group of ["a1", "shawarma", "bh_full", "bh_mini"] as DealGroup[]) {
    if (counts[group] === 0) continue;
    const tiers = DEALS.filter((d) => d.group === group && deals.on.includes(d.key));
    const hit = tiers.find((d) => counts[group] >= d.min);
    if (hit) {
      applied.push({
        key: hit.key,
        label: labelFor(hit, deals, picks[hit.key]),
        off: hit.off,
        ...(hit.choose && { choose: { count: hit.choose.count, options: dealOptions(hit, deals) } }),
      });
    }
    // The next bigger tier this group can still reach.
    const up = [...tiers].reverse().find((d) => d.min > counts[group]);
    if (up) {
      const more = up.min - counts[group];
      if (!next || more < next.more) {
        const reward = up.off > 0 ? `₹${up.off} off` : up.title.replace(/^.*?, get /, "").replace(/ free$/, " free");
        next = { key: up.key, more, text: `Add ${more} more ${more === 1 ? up.unit.replace(/s$/, "") : up.unit} for ${reward}` };
      }
    }
  }
  return { applied, next };
}

/** "Free Thums Up (pet bottle) · ₹50 off on 5 …" — orders.deals for display. */
export type OrderDeal = { key: string; label: string; off: number };

export function parseOrderDeals(raw: unknown): OrderDeal[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((d) => d && typeof d.label === "string")
    .map((d) => ({ key: String(d.key ?? ""), label: d.label as string, off: Number(d.off ?? 0) }));
}
