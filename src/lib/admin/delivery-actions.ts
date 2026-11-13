"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin/assert";
import { formatTime, startOfTodayIST } from "@/lib/date";
import { BATCH_COLUMNS, MAX_DELIVERY_NOTE, todayKey, type BatchRow } from "@/lib/delivery";
import { isUuid } from "@/lib/ids";
import { notifyUser } from "@/lib/notifications/send";
import { formatOrderNumber } from "@/lib/orders/status";
import { normalizeIndianMobile } from "@/lib/phone";
import { getSessionProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type BatchInput = {
  /** "HH:MM", 24-hour IST — orders placed before this join the batch. */
  orderUntil: string;
  /** "HH:MM", 24-hour IST — when it'll be at Main Gate. */
  deliverAt: string;
  /** "HH:MM" — normal delivery's window start ("between 8:00 and 8:15"), optional. */
  deliverFrom?: string;
  note?: string;
  riderPhone?: string;
};

export type DeliveryActionResult = { ok: true; notified: number } | { ok: false; error: string };

/** The orders still waiting (not delivered / cancelled). */
const OPEN = ["pending", "confirmed", "preparing", "out_for_delivery"];

/** Today's IST date at HH:MM, as a real instant. */
function todayAt(hhmm: string, now: Date): Date | null {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  if (!m) return null;
  return new Date(startOfTodayIST(now).getTime() + (Number(m[1]) * 60 + Number(m[2])) * 60_000);
}

function parseInput(input: BatchInput, now: Date) {
  const until = todayAt(input.orderUntil ?? "", now);
  const at = todayAt(input.deliverAt ?? "", now);
  if (!until) return { error: "Pick until when orders join this batch." } as const;
  if (!at) return { error: "Pick when it'll be delivered." } as const;
  if (at.getTime() < until.getTime()) return { error: "Delivery can't be before the orders close." } as const;
  const from = input.deliverFrom ? todayAt(input.deliverFrom, now) : null;
  if (from && (from.getTime() > at.getTime() || from.getTime() < until.getTime())) {
    return { error: "The window should start after the cut-off and end with the delivery time." } as const;
  }
  const note = (input.note ?? "").replace(/\s+/g, " ").trim();
  if (note.length > MAX_DELIVERY_NOTE) return { error: `Keep the message under ${MAX_DELIVERY_NOTE} characters.` } as const;
  let riderPhone: string | null = null;
  if (input.riderPhone && input.riderPhone.trim()) {
    riderPhone = normalizeIndianMobile(input.riderPhone);
    if (!riderPhone) return { error: "That phone number doesn't look right — 10 digits, starting 6–9." } as const;
  }
  return { until, at, from, note: note || null, riderPhone } as const;
}

/**
 * Pings the students whose open orders are in these batches (in after(),
 * so a slow push service never holds the admin up). Returns how many.
 */
async function notifyBatchOrders(supabase: Supabase, batchIds: string[], body: (o: { promised_at: string | null }) => string) {
  if (batchIds.length === 0) return 0;
  const { data } = await supabase
    .from("orders")
    .select("id, user_id, daily_number, promised_at")
    .in("batch_id", batchIds)
    .in("status", OPEN)
    .returns<{ id: string; user_id: string; daily_number: number; promised_at: string | null }[]>();
  const orders = data ?? [];
  after(async () => {
    for (const o of orders) {
      await notifyUser(supabase, o.user_id, {
        title: `Delivery update · ${formatOrderNumber(o.daily_number)}`,
        body: body(o),
        url: `/orders/${o.id}`,
        tag: `delivery-${o.id}`,
      });
    }
  });
  return new Set(orders.map((o) => o.user_id)).size;
}

/** Moves the open orders of a batch to its (new) delivery time. */
async function syncBatchOrders(supabase: Supabase, batchId: string, deliverAt: string) {
  await supabase.from("orders").update({ promised_at: deliverAt }).eq("batch_id", batchId).in("status", OPEN);
}

/**
 * Adds a batch for today — orders until HH:MM → delivered by HH:MM, an
 * optional message and the delivery person's phone — to one restaurant or
 * several ("Same for all that are on"). A restaurant that already has a
 * batch with that cut-off gets it updated instead.
 */
export async function addBatch(restaurantIds: string[], input: BatchInput): Promise<DeliveryActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;
  if (!Array.isArray(restaurantIds) || restaurantIds.length === 0 || !restaurantIds.every(isUuid)) {
    return { ok: false, error: "Pick a restaurant." };
  }
  const now = new Date();
  const parsed = parseInput(input, now);
  if ("error" in parsed) return { ok: false, error: parsed.error! };
  if (parsed.until.getTime() <= now.getTime()) return { ok: false, error: "That cut-off has already gone — pick a later one." };

  const { profile } = await getSessionProfile();
  const supabase = await createClient();
  const rows = restaurantIds.map((id) => ({
    restaurant_id: id,
    day: todayKey(now),
    order_until: parsed.until.toISOString(),
    deliver_at: parsed.at.toISOString(),
    deliver_from: parsed.from?.toISOString() ?? null,
    note: parsed.note,
    rider_phone: parsed.riderPhone,
    updated_at: now.toISOString(),
    updated_by: profile?.id ?? null,
  }));
  const { data, error } = await supabase
    .from("delivery_batches")
    .upsert(rows, { onConflict: "restaurant_id,order_until" })
    .select("id");
  if (error) return { ok: false, error: "Couldn't save the batch. Please try again." };
  // Re-saving an existing cut-off can move orders already in it.
  for (const b of data ?? []) await syncBatchOrders(supabase, b.id, parsed.at.toISOString());
  const notified = await notifyBatchOrders(
    supabase,
    (data ?? []).map((b) => b.id),
    () => `Delivery by ${formatTime(parsed.at.toISOString())} at Main Gate.${parsed.note ? ` ${parsed.note}` : ""}`,
  );
  revalidatePath("/", "layout");
  return { ok: true, notified };
}

/** Edits one batch; its open orders move to the new delivery time and are told. */
export async function updateBatch(batchId: string, input: BatchInput): Promise<DeliveryActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;
  if (!isUuid(batchId)) return { ok: false, error: "Unknown batch." };
  const now = new Date();
  const parsed = parseInput(input, now);
  if ("error" in parsed) return { ok: false, error: parsed.error! };

  const { profile } = await getSessionProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("delivery_batches")
    .update({
      order_until: parsed.until.toISOString(),
      deliver_at: parsed.at.toISOString(),
      deliver_from: parsed.from?.toISOString() ?? null,
      note: parsed.note,
      rider_phone: parsed.riderPhone,
      updated_at: now.toISOString(),
      updated_by: profile?.id ?? null,
    })
    .eq("id", batchId);
  if (error) {
    return { ok: false, error: error.code === "23505" ? "There's already a batch with that cut-off." : "Couldn't save the batch. Please try again." };
  }
  await syncBatchOrders(supabase, batchId, parsed.at.toISOString());
  const notified = await notifyBatchOrders(
    supabase,
    [batchId],
    () => `Delivery by ${formatTime(parsed.at.toISOString())} at Main Gate.${parsed.note ? ` ${parsed.note}` : ""}`,
  );
  revalidatePath("/", "layout");
  return { ok: true, notified };
}

/** The note "Late +N" adds when the admin hasn't written one. */
const LATE_NOTE = "Running a little late, sorry!";

/**
 * "Late? +15 / +30 min" on a batch: pushes its delivery time back by
 * `minutes` (from now if it's already passed), adds a sorry note unless one
 * is there, moves its open orders and tells those students.
 */
export async function delayBatch(batchId: string, minutes: number): Promise<DeliveryActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;
  if (!isUuid(batchId) || ![10, 15, 20, 30, 45, 60].includes(minutes)) return { ok: false, error: "Unknown delay." };
  const supabase = await createClient();
  const { data: row } = await supabase.from("delivery_batches").select(BATCH_COLUMNS).eq("id", batchId).maybeSingle<BatchRow>();
  if (!row) return { ok: false, error: "That batch is gone." };

  const now = new Date();
  const deliverAt = new Date(Math.max(new Date(row.deliver_at).getTime(), now.getTime()) + minutes * 60_000);
  const note = row.note || LATE_NOTE;
  const { profile } = await getSessionProfile();
  const { error } = await supabase
    .from("delivery_batches")
    .update({ deliver_at: deliverAt.toISOString(), note, updated_at: now.toISOString(), updated_by: profile?.id ?? null })
    .eq("id", batchId);
  if (error) return { ok: false, error: "Couldn't update the time. Please try again." };
  await syncBatchOrders(supabase, batchId, deliverAt.toISOString());
  const notified = await notifyBatchOrders(
    supabase,
    [batchId],
    () => `Running late — now by ${formatTime(deliverAt.toISOString())} at Main Gate. ${note === LATE_NOTE ? "Sorry!" : note}`,
  );
  revalidatePath("/", "layout");
  return { ok: true, notified };
}

/** Removes a batch (its orders keep the time they were promised). */
export async function removeBatch(batchId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const denied = await assertAdmin();
  if (denied) return denied;
  if (!isUuid(batchId)) return { ok: false, error: "Unknown batch." };
  const supabase = await createClient();
  const { error } = await supabase.from("delivery_batches").delete().eq("id", batchId);
  if (error) return { ok: false, error: "Couldn't remove it. Please try again." };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Moves one order into another of its restaurant's batches (it just missed a cut-off, or made it after all). */
export async function moveOrderToBatch(orderId: string, batchId: string): Promise<DeliveryActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;
  if (!isUuid(orderId) || !isUuid(batchId)) return { ok: false, error: "Unknown order or batch." };
  const supabase = await createClient();
  const [{ data: order }, { data: batch }] = await Promise.all([
    supabase.from("orders").select("id, user_id, daily_number, restaurant_id, status").eq("id", orderId).maybeSingle(),
    supabase.from("delivery_batches").select(BATCH_COLUMNS).eq("id", batchId).maybeSingle<BatchRow>(),
  ]);
  if (!order || !batch || batch.restaurant_id !== order.restaurant_id) return { ok: false, error: "That batch isn't this restaurant's." };
  if (!OPEN.includes(order.status)) return { ok: false, error: "This order is already finished." };

  const { error } = await supabase
    .from("orders")
    .update({ batch_id: batchId, promised_at: batch.deliver_at })
    .eq("id", orderId)
    .in("status", OPEN);
  if (error) return { ok: false, error: "Couldn't move the order. Please try again." };
  after(() =>
    notifyUser(supabase, order.user_id, {
      title: `Delivery update · ${formatOrderNumber(order.daily_number)}`,
      body: `Delivery by ${formatTime(batch.deliver_at)} at Main Gate.${batch.note ? ` ${batch.note}` : ""}`,
      url: `/orders/${order.id}`,
      tag: `delivery-${order.id}`,
    }),
  );
  revalidatePath("/", "layout");
  return { ok: true, notified: 1 };
}

/** The Delivery tab's switch: one normal evening delivery for all, or batches per restaurant. */
export async function setDeliveryMode(mode: "normal" | "batches"): Promise<{ ok: true } | { ok: false; error: string }> {
  const denied = await assertAdmin();
  if (denied) return denied;
  if (mode !== "normal" && mode !== "batches") return { ok: false, error: "Unknown mode." };
  const supabase = await createClient();
  const { error } = await supabase.from("app_settings").update({ delivery_mode: mode }).eq("id", true);
  if (error) return { ok: false, error: "Couldn't switch. Please try again." };
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/**
 * Normal delivery: one evening delivery for every restaurant that's on
 * (express ones aside) — orders until X, delivered between Y and Z. It
 * replaces today's batches for them, and today's open evening orders move
 * to it (and are told), so there's always exactly one time.
 */
export async function setNormalDelivery(input: BatchInput): Promise<DeliveryActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;
  const now = new Date();
  const parsed = parseInput(input, now);
  if ("error" in parsed) return { ok: false, error: parsed.error! };
  const supabase = await createClient();
  const { data: on } = await supabase
    .from("restaurants")
    .select("id")
    .eq("is_active", true)
    .is("archived_at", null)
    .is("delivery_minutes", null);
  const ids = (on ?? []).map((r) => r.id);
  if (ids.length === 0) return { ok: false, error: "Turn a restaurant on in Kitchen first." };

  await supabase.from("delivery_batches").delete().in("restaurant_id", ids).eq("day", todayKey(now));
  const { profile } = await getSessionProfile();
  const { data: rows, error } = await supabase
    .from("delivery_batches")
    .insert(
      ids.map((id) => ({
        restaurant_id: id,
        day: todayKey(now),
        order_until: parsed.until.toISOString(),
        deliver_at: parsed.at.toISOString(),
        deliver_from: parsed.from?.toISOString() ?? null,
        note: parsed.note,
        rider_phone: parsed.riderPhone,
        updated_at: now.toISOString(),
        updated_by: profile?.id ?? null,
      })),
    )
    .select("id, restaurant_id");
  if (error || !rows) return { ok: false, error: "Couldn't save the delivery. Please try again." };
  // Today's open evening orders (lost their batch above) join the new one.
  for (const r of rows) {
    await supabase
      .from("orders")
      .update({ batch_id: r.id, promised_at: parsed.at.toISOString() })
      .eq("restaurant_id", r.restaurant_id)
      .is("batch_id", null)
      .gte("created_at", startOfTodayIST(now).toISOString())
      .neq("promised_at", new Date(startOfTodayIST(now).getTime() + 14 * 3600_000).toISOString())
      .in("status", OPEN);
  }
  const notified = await notifyBatchOrders(
    supabase,
    rows.map((r) => r.id),
    () => `Delivery by ${formatTime(parsed.at.toISOString())} at Main Gate.${parsed.note ? ` ${parsed.note}` : ""}`,
  );
  revalidatePath("/", "layout");
  return { ok: true, notified };
}
