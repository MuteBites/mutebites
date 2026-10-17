"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { assertAdmin } from "@/lib/admin/assert";
import { isPastDeliverySlot } from "@/lib/date";
import { notifyOrderingOpen, type OpenPushResult } from "@/lib/notifications/ordering-open";
import { notifyUser, type PushPayload } from "@/lib/notifications/send";
import type { OrderStatus } from "@/lib/data/types";
import { isUuid } from "@/lib/ids";
import { isOfferKey, isPercentOfferKey, type OfferKey, type PercentOfferKey } from "@/lib/offers";
import type { OrderingMode } from "@/lib/ordering";
import { formatOrderNumber, nextStatus } from "@/lib/orders/status";
import { getSessionProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export type AdminActionResult = { ok: true } | { ok: false; error: string };

/** Opening ordering / turning a restaurant on may also send the "we're open" push. */
export type OpenActionResult = { ok: true; push?: OpenPushResult } | { ok: false; error: string };


/**
 * Turns one discount offer on or off (app_settings.offer_*). Students see
 * it in the cart straight away; place_order() refuses an offer that's off.
 * Ported from College Bites.
 */
export async function setOfferEnabled(offer: OfferKey, enabled: boolean): Promise<AdminActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;
  if (!isOfferKey(offer) || typeof enabled !== "boolean") return { ok: false, error: "Unknown offer." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .update({ [`offer_${offer}`]: enabled, updated_at: new Date().toISOString() })
    .eq("id", true);
  if (error) return { ok: false, error: "Couldn't update the offer. Please try again." };

  revalidatePath("/", "layout"); // the cart on Home and every menu
  return { ok: true };
}

/**
 * Switches 10% / 20% off on or off for one restaurant. Off = a row in
 * offer_restaurant_exclusions (so a new restaurant gets every offer);
 * place_order() refuses an offer at a restaurant switched off for it.
 */
export async function setOfferRestaurant(
  offer: PercentOfferKey,
  restaurantId: string,
  enabled: boolean,
): Promise<AdminActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;
  if (!isPercentOfferKey(offer) || !isUuid(restaurantId) || typeof enabled !== "boolean") {
    return { ok: false, error: "Unknown offer or restaurant." };
  }

  const supabase = await createClient();
  const { error } = enabled
    ? await supabase.from("offer_restaurant_exclusions").delete().eq("offer", offer).eq("restaurant_id", restaurantId)
    : await supabase
        .from("offer_restaurant_exclusions")
        .upsert({ offer, restaurant_id: restaurantId }, { onConflict: "offer,restaurant_id", ignoreDuplicates: true });
  if (error) return { ok: false, error: "Couldn't update the offer. Please try again." };

  revalidatePath("/", "layout"); // the cart on Home and every menu
  return { ok: true };
}

/**
 * Campus-wide ordering switch: 'open' or 'closed' (there is no daily
 * schedule). 'closed' also turns every restaurant off, so a close is total —
 * switching back to Open leaves them off, and the admin turns on whichever
 * restaurants should reopen.
 */
export async function setOrderingMode(mode: OrderingMode): Promise<OpenActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;
  if (mode !== "open" && mode !== "closed") {
    return { ok: false, error: "Unknown ordering mode." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .update({ ordering_mode: mode, updated_at: new Date().toISOString() })
    .eq("id", true);
  if (error) return { ok: false, error: "Couldn't update ordering. Please try again." };

  if (mode === "closed") {
    const { error: restaurantsError } = await supabase
      .from("restaurants")
      .update({ is_active: false })
      .eq("is_active", true);
    if (restaurantsError) {
      revalidatePath("/admin");
      return { ok: false, error: "Ordering is closed, but turning the restaurants off failed. Please try again." };
    }
    revalidatePath("/", "layout"); // student home + menu pages read is_active
  }

  revalidatePath("/admin");
  // Fires only once a restaurant is on too (see notifyOrderingOpen).
  if (mode === "open") return { ok: true, push: await notifyOrderingOpen(supabase) };
  return { ok: true };
}

/** Opens or closes one restaurant. */
export async function setRestaurantActive(
  restaurantId: string,
  active: boolean,
): Promise<OpenActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurants")
    .update({ is_active: active })
    .eq("id", restaurantId);
  if (error) return { ok: false, error: "Couldn't update that restaurant. Please try again." };

  revalidatePath("/admin");
  revalidatePath("/", "layout"); // student home + menu pages also read is_active
  // The first restaurant on while ordering is open sends the "we're open" push.
  if (active) return { ok: true, push: await notifyOrderingOpen(supabase) };
  return { ok: true };
}

/**
 * Marks a student's all-milestones free biryani as handed over (or undoes
 * it). The Users page only offers this for students who have unlocked
 * every milestone; the table's primary key keeps it to one per student.
 */
export async function setMilestoneRewardClaimed(
  userId: string,
  claimed: boolean,
): Promise<AdminActionResult & { claimedAt?: string }> {
  const { profile } = await getSessionProfile();
  if (!profile || profile.role !== "admin") return { ok: false, error: "Admins only." };

  const supabase = await createClient();
  if (claimed) {
    const { data, error } = await supabase
      .from("milestone_rewards")
      .insert({ user_id: userId, marked_by: profile.id })
      .select("claimed_at")
      .single();
    if (error) {
      return {
        ok: false,
        error: error.code === "23505" ? "Already marked as claimed." : "Couldn't mark it claimed. Please try again.",
      };
    }
    revalidatePath("/admin/users");
    revalidatePath("/profile");
    return { ok: true, claimedAt: data.claimed_at };
  }

  const { error } = await supabase.from("milestone_rewards").delete().eq("user_id", userId);
  if (error) return { ok: false, error: "Couldn't undo that. Please try again." };
  revalidatePath("/admin/users");
  revalidatePath("/profile");
  return { ok: true };
}

/**
 * Marks one dish sold out (or back on sale) from /admin/sold-out. The menu
 * keeps showing a sold-out dish, greyed out and unorderable, and
 * place_order() refuses it anyway — this only flips the flag.
 */
export async function setDishAvailable(dishId: string, available: boolean): Promise<AdminActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const supabase = await createClient();
  const { error } = await supabase.from("dishes").update({ is_available: available }).eq("id", dishId);
  if (error) return { ok: false, error: "Couldn't update that dish. Please try again." };

  revalidatePath("/admin/sold-out");
  revalidatePath("/", "layout"); // student menus, search and Home cards read is_available
  return { ok: true };
}

/**
 * Advances one order to the next status in STATUS_FLOW. `currentStatus` is
 * what the admin's screen showed when they clicked — the update only
 * applies if the row is still at that status, so two admins clicking the
 * same order (or a stale screen) can't silently skip or redo a step.
 */
export async function advanceOrderStatus(
  orderId: string,
  currentStatus: OrderStatus,
): Promise<AdminActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const next = nextStatus(currentStatus);
  if (!next) return { ok: false, error: "This order can't be advanced any further." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status: next })
    .eq("id", orderId)
    .eq("status", currentStatus)
    .select("id, user_id, daily_number, restaurants(name)")
    .returns<OrderNotifyRow[]>();
  if (error) return { ok: false, error: "Couldn't update that order. Please try again." };
  if (!data || data.length === 0) {
    return { ok: false, error: "That order just changed — refresh and try again." };
  }

  const order = data[0];
  after(() => notifyUser(supabase, order.user_id, statusPayload(order, next)));

  revalidatePath("/admin");
  return { ok: true };
}

type OrderNotifyRow = {
  id: string;
  user_id: string;
  daily_number: number;
  restaurants: { name: string } | null;
};

/** What a student sees on their phone when their order moves on. */
function statusPayload(order: OrderNotifyRow, status: OrderStatus): PushPayload {
  const token = formatOrderNumber(order.daily_number);
  const where = order.restaurants?.name ?? "MuteBites";
  const copy: Partial<Record<OrderStatus, { title: string; body: string }>> = {
    confirmed: {
      title: `Order ${token} confirmed`,
      body: `${where} is preparing your food. We'll call you at the gate.`,
    },
    delivered: {
      title: `Order ${token} delivered`,
      body: "Enjoy! Tap to rate what you ate.",
    },
    cancelled: {
      title: `Order ${token} was cancelled`,
      body: `Your ${where} order won't be delivered. Tap for details.`,
    },
  };
  const { title, body } = copy[status] ?? { title: `Order ${token} updated`, body: `${where} · ${status}` };
  return { title, body, url: `/orders/${order.id}`, tag: `order-${order.id}` };
}

/**
 * Cancels one order. Only orders that haven't already finished one way or
 * the other can be cancelled — `currentStatus` is compare-and-swapped the
 * same way advanceOrderStatus() is, so a stale screen can't cancel an
 * order that's since been delivered (or already cancelled) out from
 * under it.
 */
export async function cancelOrder(orderId: string, currentStatus: OrderStatus): Promise<AdminActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  if (currentStatus === "delivered" || currentStatus === "cancelled") {
    return { ok: false, error: "This order can't be cancelled." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .eq("status", currentStatus)
    .select("id, user_id, daily_number, restaurants(name)")
    .returns<OrderNotifyRow[]>();
  if (error) return { ok: false, error: "Couldn't cancel that order. Please try again." };
  if (!data || data.length === 0) {
    return { ok: false, error: "That order just changed — refresh and try again." };
  }

  const cancelled = data[0];
  after(() => notifyUser(supabase, cancelled.user_id, statusPayload(cancelled, "cancelled")));

  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Bans or unbans one student. See current_user_is_banned() for how a ban
 * actually matches (by phone number, not this specific account) — this
 * just flips the flag on the row the admin picked.
 */
export async function setStudentBanned(userId: string, banned: boolean): Promise<AdminActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const supabase = await createClient();
  const { error } = await supabase.from("users").update({ is_banned: banned }).eq("id", userId);
  if (error) return { ok: false, error: "Couldn't update that student. Please try again." };

  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Bulk-advances every `confirmed` order whose delivery slot has already
 * ended straight to `delivered` — a confirmed order still inside its
 * window is left alone even though it's shown in the same list. Re-checks
 * slot end here rather than trusting whatever the client sent, same as
 * every other admin write in this file trusting only what it reads itself.
 */
export async function markAllConfirmedDelivered(): Promise<
  { ok: true; count: number } | { ok: false; error: string }
> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const supabase = await createClient();
  const { data: confirmed, error: fetchError } = await supabase
    .from("orders")
    .select("id, created_at")
    .eq("status", "confirmed");
  if (fetchError) return { ok: false, error: "Couldn't load confirmed orders. Please try again." };

  const eligibleIds = (confirmed ?? [])
    .filter((o) => isPastDeliverySlot(o.created_at))
    .map((o) => o.id);
  if (eligibleIds.length === 0) {
    return { ok: false, error: "No confirmed orders have passed their delivery slot yet." };
  }

  // Compare-and-swap on status like the single-order actions: an order a
  // second admin cancelled or already delivered in the meantime is skipped.
  const { data: updated, error } = await supabase
    .from("orders")
    .update({ status: "delivered" })
    .in("id", eligibleIds)
    .eq("status", "confirmed")
    .select("id, user_id, daily_number, restaurants(name)")
    .returns<OrderNotifyRow[]>();
  if (error) return { ok: false, error: "Couldn't update those orders. Please try again." };

  // One notification per order, so a student who had two orders delivered
  // hears about both (each carries its own token).
  after(async () => {
    for (const order of updated ?? []) {
      await notifyUser(supabase, order.user_id, statusPayload(order, "delivered"));
    }
  });

  revalidatePath("/admin");
  return { ok: true, count: updated?.length ?? 0 };
}

export type StudentSearchResult = {
  id: string;
  fullName: string;
  phone: string;
  registrationNumber: string | null;
  isBanned: boolean;
};

export type SearchStudentsResult =
  | { ok: true; results: StudentSearchResult[] }
  | { ok: false; error: string };

/** Looks up students by name, phone, or registration number, for the "ban a student" search. */
export async function searchStudents(query: string): Promise<SearchStudentsResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  // Strip characters that would break the .or() filter string below.
  const term = query.trim().replace(/[,()%_]/g, "");
  if (term.length < 2) return { ok: true, results: [] };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, phone, registration_number, is_banned")
    .or(`full_name.ilike.%${term}%,phone.ilike.%${term}%,registration_number.ilike.%${term}%`)
    .order("full_name")
    .limit(10);
  if (error) return { ok: false, error: "Search failed. Please try again." };

  return {
    ok: true,
    results: (data ?? []).map((u) => ({
      id: u.id,
      fullName: u.full_name,
      phone: u.phone,
      registrationNumber: u.registration_number,
      isBanned: u.is_banned,
    })),
  };
}
