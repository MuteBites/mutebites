"use client";

import { useEffect, useState } from "react";
import { DELIVERY_COLUMNS, deliveryLine, isLunchNow, isSetToday, LUNCH_WINDOW, toDeliveryInfo, type DeliveryRow } from "@/lib/delivery";
import { createClient } from "@/lib/supabase/client";

/**
 * The cart's delivery line for an order placed now: lunch (before 12:45
 * PM) is the fixed window; otherwise the restaurant's time set today, read
 * when the cart opens. "none" = no time set, so it can't be ordered yet
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
      .from("delivery_info")
      .select(DELIVERY_COLUMNS)
      .eq("restaurant_id", restaurantId)
      .maybeSingle<DeliveryRow>()
      .then(({ data }) => {
        if (cancelled) return;
        const info = data ? toDeliveryInfo(data) : null;
        if (!isSetToday(info)) return setLine("none");
        const l = deliveryLine(info);
        setLine(`${l.lead} ${l.time}`);
      });
    return () => {
      cancelled = true;
    };
  }, [restaurantId, open]);

  return line;
}
