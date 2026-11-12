"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin/assert";
import { formatTime, startOfTodayIST } from "@/lib/date";
import {
  DELIVERY_COLUMNS,
  deliveryLine,
  isLunchOrder,
  isSetToday,
  MAX_DELIVERY_NOTE,
  toDeliveryInfo,
  type DeliveryMode,
  type DeliveryRow,
} from "@/lib/delivery";
import { isUuid } from "@/lib/ids";
import { notifyUser } from "@/lib/notifications/send";
import { formatOrderNumber } from "@/lib/orders/status";
import { normalizeIndianMobile } from "@/lib/phone";
import { getSessionProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export type DeliveryInput = {
  mode: DeliveryMode;
  /** "HH:MM", 24-hour IST — for mode "at". */
  time?: string;
  /** For mode "within". */
  minutes?: number;
  note?: string;
  riderPhone?: string;
};

export type DeliveryActionResult = { ok: true; notified: number } | { ok: false; error: string };

/** Today's IST date at HH:MM, as a real instant. */
function todayAt(hhmm: string, now: Date): Date | null {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  if (!m) return null;
  const midnight = startOfTodayIST(now).getTime();
  return new Date(midnight + (Number(m[1]) * 60 + Number(m[2])) * 60_000);
}

/**
 * Sets when one or more restaurants will deliver today (the Delivery tab,
 * and the prompt before turning a restaurant on): an exact time, or
 * "within N minutes" (stored as the time it comes to), plus an optional
 * note and the delivery person's phone. Then pings every student with a
 * live order from those restaurants today, so the change reaches them
 * even with the ticket closed (open tickets also update live).
 */
export async function setDeliveryInfo(restaurantIds: string[], input: DeliveryInput): Promise<DeliveryActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;
  if (!Array.isArray(restaurantIds) || restaurantIds.length === 0 || !restaurantIds.every(isUuid)) {
    return { ok: false, error: "Pick a restaurant." };
  }

  const now = new Date();
  let deliverAt: Date;
  let withinMinutes: number | null = null;
  if (input.mode === "within") {
    const minutes = Number(input.minutes);
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 180) return { ok: false, error: "Pick how many minutes." };
    withinMinutes = minutes;
    deliverAt = new Date(now.getTime() + minutes * 60_000);
  } else if (input.mode === "at") {
    const at = todayAt(input.time ?? "", now);
    if (!at) return { ok: false, error: "Pick a delivery time." };
    if (at.getTime() < now.getTime() - 5 * 60_000) return { ok: false, error: "That time has already gone — pick a later one." };
    deliverAt = at;
  } else {
    return { ok: false, error: "Pick a delivery time." };
  }

  const note = (input.note ?? "").replace(/\s+/g, " ").trim();
  if (note.length > MAX_DELIVERY_NOTE) return { ok: false, error: `Keep the message under ${MAX_DELIVERY_NOTE} characters.` };
  let riderPhone: string | null = null;
  if (input.riderPhone && input.riderPhone.trim()) {
    riderPhone = normalizeIndianMobile(input.riderPhone);
    if (!riderPhone) return { ok: false, error: "That phone number doesn't look right — 10 digits, starting 6–9." };
  }

  const { profile } = await getSessionProfile();
  const supabase = await createClient();
  const rows = restaurantIds.map((id) => ({
    restaurant_id: id,
    mode: input.mode,
    deliver_at: deliverAt.toISOString(),
    within_minutes: withinMinutes,
    note: note || null,
    rider_phone: riderPhone,
    updated_at: now.toISOString(),
    updated_by: profile?.id ?? null,
  }));
  const { error } = await supabase.from("delivery_info").upsert(rows, { onConflict: "restaurant_id" });
  if (error) return { ok: false, error: "Couldn't save the delivery time. Please try again." };

  const line = deliveryLine(toDeliveryInfo({ ...rows[0], within_minutes: withinMinutes }));
  const notified = await notifyLiveOrders(supabase, restaurantIds, `${line.lead} ${line.time} at Main Gate.${note ? ` ${note}` : ""}`, now);

  revalidatePath("/", "layout"); // tickets, Orders, Home, the admin tabs
  return { ok: true, notified };
}

/**
 * Pings every student with a live evening / night order from these
 * restaurants today (lunch orders keep their fixed window, so they're left
 * out), in after() so a slow push service never holds the admin up.
 * Returns how many students that is.
 */
async function notifyLiveOrders(
  supabase: Awaited<ReturnType<typeof createClient>>,
  restaurantIds: string[],
  body: string,
  now: Date,
): Promise<number> {
  const { data: live } = await supabase
    .from("orders")
    .select("id, user_id, daily_number, created_at")
    .in("restaurant_id", restaurantIds)
    .in("status", ["pending", "confirmed", "preparing", "out_for_delivery"])
    .gte("created_at", startOfTodayIST(now).toISOString())
    .returns<{ id: string; user_id: string; daily_number: number; created_at: string }[]>();
  const orders = (live ?? []).filter((o) => !isLunchOrder(o.created_at));
  const text = body.replace(/ /g, " ");
  after(async () => {
    for (const o of orders) {
      await notifyUser(supabase, o.user_id, {
        title: `Delivery update · ${formatOrderNumber(o.daily_number)}`,
        body: text,
        url: `/orders/${o.id}`,
        tag: `delivery-${o.id}`,
      });
    }
  });
  return new Set(orders.map((o) => o.user_id)).size;
}

/** The note added by "Late? +N min" when the admin hasn't written one. */
const LATE_NOTE = "Running a little late, sorry!";

/**
 * "Late? +15 / +30 min" on a restaurant's Delivery card: pushes its time
 * back by `minutes` (from now if it's already passed), adds a sorry note
 * unless one's there, and tells the students waiting — one tap for the
 * usual "the batch is running late".
 */
export async function delayDelivery(restaurantId: string, minutes: number): Promise<DeliveryActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;
  if (!isUuid(restaurantId) || ![10, 15, 20, 30, 45, 60].includes(minutes)) return { ok: false, error: "Unknown delay." };

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("delivery_info")
    .select(DELIVERY_COLUMNS)
    .eq("restaurant_id", restaurantId)
    .maybeSingle<DeliveryRow>();
  const now = new Date();
  if (!row || !isSetToday(toDeliveryInfo(row), now)) return { ok: false, error: "Set today's delivery time first." };

  const from = Math.max(new Date(row.deliver_at).getTime(), now.getTime());
  const deliverAt = new Date(from + minutes * 60_000);
  const note = row.note || LATE_NOTE;
  const { profile } = await getSessionProfile();
  const { error } = await supabase
    .from("delivery_info")
    .update({
      mode: "at",
      deliver_at: deliverAt.toISOString(),
      within_minutes: null,
      note,
      updated_at: now.toISOString(),
      updated_by: profile?.id ?? null,
    })
    .eq("restaurant_id", restaurantId);
  if (error) return { ok: false, error: "Couldn't update the time. Please try again." };

  const notified = await notifyLiveOrders(
    supabase,
    [restaurantId],
    `Running late — now by ${formatTime(deliverAt.toISOString())} at Main Gate. ${note === LATE_NOTE ? "Sorry!" : note}`,
    now,
  );
  revalidatePath("/", "layout");
  return { ok: true, notified };
}

/** Clears a restaurant's time (it then can't take orders until a new one is set). */
export async function clearDeliveryInfo(restaurantId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const denied = await assertAdmin();
  if (denied) return denied;
  if (!isUuid(restaurantId)) return { ok: false, error: "Unknown restaurant." };
  const supabase = await createClient();
  const { error } = await supabase.from("delivery_info").delete().eq("restaurant_id", restaurantId);
  if (error) return { ok: false, error: "Couldn't clear it. Please try again." };
  revalidatePath("/", "layout");
  return { ok: true };
}

