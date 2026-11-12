"use client";

import { useEffect, useState } from "react";
import { BATCH_COLUMNS, clockTime, isLunchNow, LUNCH_WINDOW, todayKey, type BatchRow } from "@/lib/delivery";
import { createClient } from "@/lib/supabase/client";

/**
 * The cart's delivery line for an order placed now: lunch (before 12:45
 * PM) is the fixed window; otherwise the batch it would join (the
 * restaurant's first today whose cut-off is still ahead), read when the
 * cart opens. "none" = no batch open, so it can't be ordered yet
 * (place_order() refuses with no_delivery_time) — said up front.
 */
export function useCartDelivery(restaurantId: string | null, open: boolean): string | "none" | null {
  const [line, setLine] = useState<string | "none" | null>(null);

  useEffect(() => {
    if (!open || !restaurantId) return;
    let cancelled = false;
    if (isLunchNow()) {
      queueMicrotask(() => !cancelled && setLine(`Delivery between ${LUNCH_WINDOW}`));
      return () => {
        cancelled = true;
      };
    }
    createClient()
      .from("delivery_batches")
      .select(BATCH_COLUMNS)
      .eq("restaurant_id", restaurantId)
      .eq("day", todayKey())
      .gt("order_until", new Date().toISOString())
      .order("order_until")
      .limit(1)
      .maybeSingle<BatchRow>()
      .then(({ data }) => {
        if (cancelled) return;
        if (!data) return setLine("none");
        setLine(`Delivery by ${clockTime(data.deliver_at)} (orders until ${clockTime(data.order_until)})`);
      });
    return () => {
      cancelled = true;
    };
  }, [restaurantId, open]);

  return line;
}
