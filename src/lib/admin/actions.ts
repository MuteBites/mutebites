"use server";

import { revalidatePath } from "next/cache";
import { isPastDeliverySlot } from "@/lib/date";
import type { OrderStatus } from "@/lib/data/types";
import { nextStatus } from "@/lib/orders/status";
import { getSessionProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export type AdminActionResult = { ok: true } | { ok: false; error: string };

/**
 * Both actions below are only ever reachable from /admin, itself gated by
 * requireAdmin(). This is a friendly early exit for a direct call — the
 * real boundary is RLS: every write here also checks public.is_admin().
 */
async function assertAdmin(): Promise<{ ok: false; error: string } | null> {
  const { profile } = await getSessionProfile();
  if (!profile || profile.role !== "admin") return { ok: false, error: "Admins only." };
  return null;
}

/** Campus-wide kill switch: pauses/resumes new orders everywhere at once. */
export async function setOrderingEnabled(enabled: boolean): Promise<AdminActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .update({ ordering_enabled: enabled, updated_at: new Date().toISOString() })
    .eq("id", true);
  if (error) return { ok: false, error: "Couldn't update the kill switch. Please try again." };

  revalidatePath("/admin");
  return { ok: true };
}

/** Opens or closes one restaurant. */
export async function setRestaurantActive(
  restaurantId: string,
  active: boolean,
): Promise<AdminActionResult> {
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
    .select("id");
  if (error) return { ok: false, error: "Couldn't update that order. Please try again." };
  if (!data || data.length === 0) {
    return { ok: false, error: "That order just changed — refresh and try again." };
  }

  revalidatePath("/admin");
  return { ok: true };
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
    .select("id");
  if (error) return { ok: false, error: "Couldn't cancel that order. Please try again." };
  if (!data || data.length === 0) {
    return { ok: false, error: "That order just changed — refresh and try again." };
  }

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
export async function markAllConfirmedDelivered(): Promise<AdminActionResult> {
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

  const { error } = await supabase.from("orders").update({ status: "delivered" }).in("id", eligibleIds);
  if (error) return { ok: false, error: "Couldn't update those orders. Please try again." };

  revalidatePath("/admin");
  return { ok: true };
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
