import "server-only";

import { createClient } from "@/lib/supabase/server";
import { startOfTodayIST } from "@/lib/date";
import type { OfferKey } from "@/lib/offers";

export type AnalyticsRange = "today" | "7" | "30";

export const ANALYTICS_RANGES: { key: AnalyticsRange; label: string; previous: string }[] = [
  { key: "today", label: "Today", previous: "yesterday by now" },
  { key: "7", label: "7 days", previous: "the 7 days before" },
  { key: "30", label: "30 days", previous: "the 30 days before" },
];

export function toAnalyticsRange(value: unknown): AnalyticsRange {
  return value === "today" || value === "30" ? value : "7";
}

/** What public.admin_order_analytics() returns (numerics arrive as numbers or strings). */
export type Analytics = {
  orders: number;
  cancelled: number;
  delivered: number;
  /** Delivered orders only — cash actually taken. */
  revenue: number;
  /** Every non-cancelled order's total. */
  booked: number;
  customers: number;
  repeatCustomers: number;
  newStudents: number;
  byDay: { day: string; orders: number; revenue: number }[];
  /** ISO weekday 1 (Mon) … 7, IST hour 0–23. */
  byHour: { dow: number; hour: number; orders: number }[];
  byRestaurant: { name: string; orders: number; revenue: number }[];
  topDishes: { name: string; quantity: number; students: number }[];
  offers: { offer: OfferKey; orders: number; discount: number }[];
  ratings: { name: string; average: number; ratings: number }[];
};

type Raw = Record<string, unknown> & {
  by_day?: { day: string; orders: number; revenue: number | string }[];
  by_hour?: { dow: number; hour: number; orders: number }[];
  by_restaurant?: { name: string; orders: number; revenue: number | string }[];
  top_dishes?: { name: string; quantity: number | string; students: number }[];
  offers?: { offer: OfferKey; orders: number; discount: number | string }[];
  ratings?: { name: string; average: number | string; ratings: number }[];
};

const n = (v: unknown) => Number(v ?? 0) || 0;

function parse(raw: Raw): Analytics {
  return {
    orders: n(raw.orders),
    cancelled: n(raw.cancelled),
    delivered: n(raw.delivered),
    revenue: n(raw.revenue),
    booked: n(raw.booked),
    customers: n(raw.customers),
    repeatCustomers: n(raw.repeat_customers),
    newStudents: n(raw.new_students),
    byDay: (raw.by_day ?? []).map((d) => ({ day: d.day, orders: n(d.orders), revenue: n(d.revenue) })),
    byHour: (raw.by_hour ?? []).map((h) => ({ dow: n(h.dow), hour: n(h.hour), orders: n(h.orders) })),
    byRestaurant: (raw.by_restaurant ?? []).map((r) => ({ name: r.name, orders: n(r.orders), revenue: n(r.revenue) })),
    topDishes: (raw.top_dishes ?? []).map((d) => ({ name: d.name, quantity: n(d.quantity), students: n(d.students) })),
    offers: (raw.offers ?? []).map((o) => ({ offer: o.offer, orders: n(o.orders), discount: n(o.discount) })),
    ratings: (raw.ratings ?? []).map((r) => ({ name: r.name, average: n(r.average), ratings: n(r.ratings) })),
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** The range [from, now) and the one just before it of the same length, in epoch ms. */
export function rangeBounds(range: AnalyticsRange, now: Date = new Date()) {
  const today = startOfTodayIST(now).getTime();
  const days = range === "today" ? 1 : Number(range);
  const from = today - (days - 1) * DAY_MS;
  const length = range === "today" ? now.getTime() - today : now.getTime() - from;
  const prevFrom = range === "today" ? today - DAY_MS : from - days * DAY_MS;
  const prevTo = range === "today" ? today - DAY_MS + length : from;
  return { from, prevFrom, prevTo };
}

/**
 * The chosen range and the one just before it, of the same length, so
 * every number can say ▲ / ▼. Today = midnight IST → now (vs yesterday's
 * midnight → the same time); 7 / 30 days = that many IST days, today
 * included. Summed in Postgres by admin_order_analytics() (security
 * invoker — RLS decides what the caller can count).
 */
export async function getAnalytics(range: AnalyticsRange, now: Date = new Date()) {
  const { from, prevFrom, prevTo } = rangeBounds(range, now);

  const supabase = await createClient();
  const call = (a: number, b: number) =>
    supabase.rpc("admin_order_analytics", { p_from: new Date(a).toISOString(), p_to: new Date(b).toISOString() });
  const [current, previous] = await Promise.all([call(from, now.getTime()), call(prevFrom, prevTo)]);
  if (current.error) throw current.error;
  return {
    current: parse((current.data ?? {}) as Raw),
    previous: previous.error ? null : parse((previous.data ?? {}) as Raw),
    fromIso: new Date(from).toISOString(),
  };
}

/** Everyone registered on MuteBites (admins read every users row). */
export async function getStudentCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase.from("users").select("id", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}
