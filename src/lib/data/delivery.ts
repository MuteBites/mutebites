import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { BATCH_COLUMNS, todayKey, toBatch, type Batch, type BatchRow } from "@/lib/delivery";

/**
 * Today's delivery batches (IST), by restaurant id, earliest cut-off
 * first. Signed-in users only (RLS). Errors read as "none". Cached per
 * request.
 */
export const getTodaysBatches = cache(async function getTodaysBatches(): Promise<Record<string, Batch[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("delivery_batches")
    .select(BATCH_COLUMNS)
    .eq("day", todayKey())
    .order("order_until")
    .returns<BatchRow[]>();
  if (error || !data) return {};
  const byRestaurant: Record<string, Batch[]> = {};
  for (const row of data) (byRestaurant[row.restaurant_id] ??= []).push(toBatch(row));
  return byRestaurant;
});

/** One batch (an order's), or null. */
export async function getBatch(id: string | null): Promise<Batch | null> {
  if (!id) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("delivery_batches").select(BATCH_COLUMNS).eq("id", id).maybeSingle<BatchRow>();
  return data ? toBatch(data) : null;
}
