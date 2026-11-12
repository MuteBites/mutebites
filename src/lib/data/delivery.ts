import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { DELIVERY_COLUMNS, isSetToday, toDeliveryInfo, type DeliveryInfo, type DeliveryRow } from "@/lib/delivery";

/**
 * Every restaurant's delivery time, as a map by restaurant id — including
 * ones set on an earlier day (orders placed that day still use them; see
 * orderDelivery()). `todayOnly` drops those. Signed-in users only (RLS).
 * Errors read as "none set". Cached per request.
 */
export const getDeliveryInfos = cache(async function getDeliveryInfos(): Promise<Record<string, DeliveryInfo>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("delivery_info").select(DELIVERY_COLUMNS).returns<DeliveryRow[]>();
  if (error || !data) return {};
  return Object.fromEntries(data.map((r) => [r.restaurant_id, toDeliveryInfo(r)]));
});

/** Only the times set today (IST). */
export async function getTodaysDeliveryInfos(): Promise<Record<string, DeliveryInfo>> {
  const all = await getDeliveryInfos();
  const now = new Date();
  return Object.fromEntries(Object.entries(all).filter(([, info]) => isSetToday(info, now)));
}
