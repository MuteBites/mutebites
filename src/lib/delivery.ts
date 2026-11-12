// Delivery times (12 Nov 2026). Lunch is fixed: an order placed before
// 12:45 PM (IST) is delivered 1:45–2 PM, nothing to set. Evening and night
// run in BATCHES the admin sets per restaurant on the Delivery tab
// (public.delivery_batches): "orders until 7:00 PM → delivered by 7:40",
// "until 7:40 → by 8:10", each with an optional message and the delivery
// person's phone. An order joins the first batch whose cut-off is still
// ahead and keeps that promise (orders.promised_at, set by place_order()),
// so adding a later batch never moves earlier tickets; "Late +15" moves one
// batch and its orders. There is NO fallback by decision: after 12:45 PM a
// restaurant with no batch still open can't be ordered from (place_order()
// raises no_delivery_time). Client-safe (no server imports).

import { formatTime, istDayKey } from "@/lib/date";

export type Batch = {
  id: string;
  restaurantId: string;
  /** "2026-11-12" — the IST day it's for. */
  day: string;
  /** Orders placed before this join the batch. */
  orderUntil: string;
  /** When it'll be at Main Gate. */
  deliverAt: string;
  note: string | null;
  /** "+91XXXXXXXXXX", or null. */
  riderPhone: string | null;
  updatedAt: string;
};

export type BatchRow = {
  id: string;
  restaurant_id: string;
  day: string;
  order_until: string;
  deliver_at: string;
  note: string | null;
  rider_phone: string | null;
  updated_at: string;
};

export const BATCH_COLUMNS = "id, restaurant_id, day, order_until, deliver_at, note, rider_phone, updated_at";

export const MAX_DELIVERY_NOTE = 200;

export function toBatch(r: BatchRow): Batch {
  return {
    id: r.id,
    restaurantId: r.restaurant_id,
    day: r.day,
    orderUntil: r.order_until,
    deliverAt: r.deliver_at,
    note: r.note,
    riderPhone: r.rider_phone,
    updatedAt: r.updated_at,
  };
}

/** Orders placed before this (IST minutes since midnight) are lunch: delivered 1:45–2 PM. */
export const LUNCH_CUTOFF_MINUTES = 12 * 60 + 45;
export const LUNCH_WINDOW = "1:45–2 PM";
/** The lunch window's end (IST), when a lunch order is promised. */
const LUNCH_END_MINUTES = 14 * 60;

const istHourMinute = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function istMinutes(iso: string): number {
  const [h, m] = istHourMinute.format(new Date(iso)).split(":").map(Number);
  return (h % 24) * 60 + m;
}

/** Placed before 12:45 PM (IST)? Then it's lunch — the fixed 1:45–2 PM delivery. */
export function isLunchOrder(createdAt: string): boolean {
  return istMinutes(createdAt) < LUNCH_CUTOFF_MINUTES;
}

/** Would an order placed now be lunch? (Before 12:45 PM no batch is needed.) */
export function isLunchNow(now: Date = new Date()): boolean {
  return isLunchOrder(now.toISOString());
}

/** 2 PM IST on the day of `iso` — a lunch order's promise. */
function lunchDue(iso: string): string {
  const dayStart = new Date(iso).getTime() - istMinutes(iso) * 60_000;
  const due = new Date(dayStart + LUNCH_END_MINUTES * 60_000);
  due.setUTCSeconds(0, 0);
  return due.toISOString();
}

/** What an order was promised, for every screen that shows it. */
export type DeliveryPromise = {
  deliverAt: string;
  /** "1:45–2 PM" for lunch, instead of one time. */
  window?: string;
  note: string | null;
  riderPhone: string | null;
};

/**
 * An order's delivery promise: lunch's fixed window, or the time it was
 * promised when placed (orders.promised_at, moved with its batch), with the
 * batch's message and rider. Null for an evening order with none (placed
 * before batches existed) — never a guess.
 */
export function orderPromise(
  order: { createdAt: string; promisedAt: string | null },
  batch?: Batch | null,
): DeliveryPromise | null {
  if (isLunchOrder(order.createdAt)) {
    return { deliverAt: order.promisedAt ?? lunchDue(order.createdAt), window: LUNCH_WINDOW, note: null, riderPhone: null };
  }
  if (!order.promisedAt) return null;
  return { deliverAt: order.promisedAt, note: batch?.note ?? null, riderPhone: batch?.riderPhone ?? null };
}

/** "8:30 PM" with a no-break space, so it never wraps apart. */
export function clockTime(iso: string): string {
  return formatTime(iso).replace(/ /g, " ");
}

/** "Delivery by 8:30 PM" / "Delivery between 1:45–2 PM" — the line students see. */
export function deliveryLine(p: { deliverAt: string; window?: string }): { lead: string; time: string } {
  if (p.window) return { lead: "Delivery between", time: p.window };
  return { lead: "Delivery by", time: clockTime(p.deliverAt) };
}

/** Today's IST day key, the `day` batches are stored under. */
export function todayKey(now: Date = new Date()): string {
  return istDayKey(now.toISOString());
}

/** The batch an order placed now would join: today's first whose cut-off is still ahead. */
export function openBatch(batches: Batch[] | undefined, now: Date = new Date()): Batch | null {
  const today = todayKey(now);
  return (
    (batches ?? [])
      .filter((b) => b.day === today && new Date(b.orderUntil).getTime() > now.getTime())
      .sort((a, b) => a.orderUntil.localeCompare(b.orderUntil))[0] ?? null
  );
}

/**
 * Home's promo line: before 12:45 PM the lunch window; after, the batch an
 * order placed now would join at the restaurants that are on — "Delivery
 * by 7:40 PM" when they share one, "Next delivery 7:40 PM" (the soonest)
 * when they differ, null when none is open.
 */
export function promoDelivery(
  activeIds: string[],
  batches: Record<string, Batch[]>,
  now: Date = new Date(),
): { lead: string; time: string } | null {
  if (isLunchNow(now)) return { lead: "Delivery between", time: LUNCH_WINDOW };
  const open = activeIds.map((id) => openBatch(batches[id], now)).filter((b): b is Batch => !!b);
  if (open.length === 0) return null;
  const times = [...new Set(open.map((b) => b.deliverAt))];
  const soonest = open.reduce((a, b) => (a.deliverAt < b.deliverAt ? a : b));
  return { lead: times.length === 1 ? "Delivery by" : "Next delivery", time: clockTime(soonest.deliverAt) };
}

/**
 * For "Mark all delivered": of these due times (null = none), how many have
 * passed, and when the soonest still ahead is (epoch ms, or null).
 */
export function dueSummary(dues: (string | null)[], now: number = Date.now()): { passed: number; next: number | null } {
  const times = dues.filter((d): d is string => !!d).map((d) => new Date(d).getTime());
  const ahead = times.filter((t) => t > now);
  return { passed: times.length - ahead.length, next: ahead.length ? Math.min(...ahead) : null };
}
