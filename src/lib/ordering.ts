// Campus ordering is a plain Open / Closed switch the admin flips from the
// dashboard (app_settings.ordering_mode) — there is no daily schedule any
// more. public.ordering_is_open() is the real enforcement (place_order()
// refuses while Closed); this only drives what the UI says.
//
// Delivery promises still follow the old slot cut-offs (deliveryWindow() /
// slotEndTime() in src/lib/date.ts: placed before 12:45 PM → by 1:30 PM,
// before 6:00 PM → by 7:30 PM, before 7:00 PM → by 8:15 PM, later → "to be
// confirmed") — by decision, 14 Oct 2026.

export type OrderingMode = "open" | "closed";

export type OrderingState = {
  /** Can a student place an order right now (what place_order() will allow). */
  open: boolean;
  mode: OrderingMode;
  /** Short chip text when closed ("Closed"). Empty when open. */
  short: string;
  /** One-line headline when closed. Empty when open. */
  headline: string;
  /** A sentence of context under the headline. Empty when open. */
  detail: string;
};

/**
 * The switch's position. Until the launch migration drops it, the database
 * can still hold the old 'auto' (the live site's admin can set it); that
 * reads as whatever ordering_is_open() says it is right now, so the admin
 * sees an honest Open / Closed and can flip it from there.
 */
export function toOrderingMode(raw: string, open: boolean): OrderingMode {
  if (raw === "open" || raw === "closed") return raw;
  return open ? "open" : "closed";
}

/**
 * What to show for ordering right now. `open` comes from the database
 * (public.ordering_is_open()) so the UI can never disagree with what
 * place_order() will actually allow; the wording is derived here.
 */
export function describeOrdering(mode: OrderingMode, open: boolean): OrderingState {
  if (open) return { open, mode, short: "", headline: "", detail: "" };
  return {
    open,
    mode,
    short: "Closed",
    headline: "Ordering is closed right now",
    detail: "Menus stay open for browsing — check back in a bit.",
  };
}
