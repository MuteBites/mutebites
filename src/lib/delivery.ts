// Delivery times (12 Nov 2026). Lunch is fixed: an order placed before
// 12:45 PM (IST) is delivered 1:45–2 PM, nothing to set. Evening and night
// batches move day to day, so after 12:45 PM the admin sets each
// restaurant's time (public.delivery_info) — they replace the old fixed
// 7:30 / 8:15 PM slots. A restaurant's time only counts for the IST day it
// was set on, and there is NO fallback by decision: with nothing set, a
// restaurant can't be ordered from after 12:45 PM (place_order() raises
// no_delivery_time) and an order shows "time coming soon", never a guess.
// Client-safe (no server imports).

import { formatTime, istDayKey } from "@/lib/date";

export type DeliveryMode = "at" | "within";

export type DeliveryInfo = {
  restaurantId: string;
  /** The fixed lunch window ("1:45–2 PM") instead of one time; lunch orders only. */
  window?: string;
  mode: DeliveryMode;
  /** When it'll be at Main Gate. For "within", the set time + the minutes. */
  deliverAt: string;
  withinMinutes: number | null;
  note: string | null;
  /** "+91XXXXXXXXXX", or null. */
  riderPhone: string | null;
  updatedAt: string;
};

export type DeliveryRow = {
  restaurant_id: string;
  mode: DeliveryMode;
  deliver_at: string;
  within_minutes: number | null;
  note: string | null;
  rider_phone: string | null;
  updated_at: string;
};

export const DELIVERY_COLUMNS = "restaurant_id, mode, deliver_at, within_minutes, note, rider_phone, updated_at";

export const MAX_DELIVERY_NOTE = 200;
export const WITHIN_CHOICES = [15, 20, 30, 45, 60];

export function toDeliveryInfo(r: DeliveryRow): DeliveryInfo {
  return {
    restaurantId: r.restaurant_id,
    mode: r.mode,
    deliverAt: r.deliver_at,
    withinMinutes: r.within_minutes,
    note: r.note,
    riderPhone: r.rider_phone,
    updatedAt: r.updated_at,
  };
}

/** Orders placed before this (IST minutes since midnight) are lunch: delivered 1:45–2 PM. */
export const LUNCH_CUTOFF_MINUTES = 12 * 60 + 45;
export const LUNCH_WINDOW = "1:45–2 PM";
/** The window's end (IST), when a lunch order counts as late. */
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

/** Would an order placed now be lunch? (Before 12:45 PM no delivery time is needed.) */
export function isLunchNow(now: Date = new Date()): boolean {
  return isLunchOrder(now.toISOString());
}

/** The fixed lunch delivery for an order placed that morning. */
function lunchDelivery(createdAt: string, restaurantId: string): DeliveryInfo {
  const minutesIntoDay = istMinutes(createdAt);
  const dayStart = new Date(createdAt).getTime() - minutesIntoDay * 60_000;
  const deliverAt = new Date(dayStart + LUNCH_END_MINUTES * 60_000);
  deliverAt.setUTCSeconds(0, 0);
  return {
    restaurantId,
    window: LUNCH_WINDOW,
    mode: "at",
    deliverAt: deliverAt.toISOString(),
    withinMinutes: null,
    note: null,
    riderPhone: null,
    updatedAt: createdAt,
  };
}

/** Set on today's IST date? Yesterday's time never counts. */
export function isSetToday(info: DeliveryInfo | null | undefined, now: Date = new Date()): info is DeliveryInfo {
  return !!info && istDayKey(info.updatedAt) === istDayKey(now.toISOString());
}

/**
 * The delivery time for an order: lunch (placed before 12:45 PM) is the
 * fixed 1:45–2 PM; otherwise its restaurant's time, if that was set on the
 * day the order was placed (IST). Otherwise null — never a guess.
 */
export function orderDelivery(
  createdAt: string,
  info: DeliveryInfo | null | undefined,
  restaurantId = info?.restaurantId ?? "",
): DeliveryInfo | null {
  if (isLunchOrder(createdAt)) return lunchDelivery(createdAt, restaurantId);
  if (!info) return null;
  return istDayKey(info.updatedAt) === istDayKey(createdAt) ? info : null;
}

/** "8:30 PM" with no-break spaces, so it never wraps apart. */
export function deliveryTime(info: DeliveryInfo): string {
  return formatTime(info.deliverAt).replace(/ /g, " ");
}

/**
 * "Delivery by 8:30 PM" — the line students see. A "within N min" time is
 * shown as the clock time it comes to too, so it never reads wrong once
 * those minutes have passed (the admin still sees how it was set).
 */
export function deliveryLine(info: DeliveryInfo): { lead: string; time: string } {
  if (info.window) return { lead: "Delivery between", time: info.window };
  return { lead: "Delivery by", time: deliveryTime(info) };
}

/**
 * Home's promo line: before 12:45 PM the fixed lunch window; after, the
 * restaurants that are on, with a time set today —
 * "Delivery by 8:30 PM" when they all share one, "Next delivery 7:30 PM"
 * (the soonest still ahead) when they differ, null when none is set.
 */
export function promoDelivery(
  activeIds: string[],
  infos: Record<string, DeliveryInfo>,
  now: Date = new Date(),
): { lead: string; time: string } | null {
  if (isLunchNow(now)) return { lead: "Delivery between", time: LUNCH_WINDOW };
  const set = activeIds.map((id) => infos[id]).filter((i): i is DeliveryInfo => isSetToday(i, now));
  if (set.length === 0) return null;
  const times = [...new Set(set.map((i) => i.deliverAt))];
  if (times.length === 1) return deliveryLine(set[0]);
  const ahead = set.filter((i) => new Date(i.deliverAt).getTime() >= now.getTime() - 5 * 60_000);
  const soonest = (ahead.length ? ahead : set).reduce((a, b) => (a.deliverAt < b.deliverAt ? a : b));
  return { lead: "Next delivery", time: deliveryTime(soonest) };
}

/**
 * For "Mark all delivered": of these due times (null = none set), how many
 * have passed, and when the soonest still ahead is (epoch ms, or null).
 */
export function dueSummary(dues: (string | null)[], now: number = Date.now()): { passed: number; next: number | null } {
  const times = dues.filter((d): d is string => !!d).map((d) => new Date(d).getTime());
  const ahead = times.filter((t) => t > now);
  return { passed: times.length - ahead.length, next: ahead.length ? Math.min(...ahead) : null };
}
