"use server";

import { assertAdmin } from "@/lib/admin/assert";
import { getAdminOrdersBetween, type AdminOrder } from "@/lib/data/admin";
import { rangeBounds, toAnalyticsRange } from "@/lib/data/analytics";

/**
 * The Analytics range's orders for the CSV export, fetched only when the
 * admin taps Export (not with every page view). Same bounds as the page's
 * numbers (rangeBounds); RLS is the real boundary, assertAdmin() the
 * friendly early exit.
 */
export async function getRangeOrders(
  range: string,
): Promise<{ ok: true; orders: AdminOrder[]; from: string } | { ok: false; error: string }> {
  const denied = await assertAdmin();
  if (denied) return denied;
  const now = new Date();
  const { from } = rangeBounds(toAnalyticsRange(range), now);
  try {
    const orders = await getAdminOrdersBetween(new Date(from), now);
    return { ok: true, orders, from: new Date(from).toISOString() };
  } catch {
    return { ok: false, error: "Couldn't load the orders. Please try again." };
  }
}
