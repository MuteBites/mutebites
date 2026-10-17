import "server-only";

import { after } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getOffers } from "@/lib/data/offers";
import { pickOpenMessage, RECENT_LIMIT } from "@/lib/notifications/open-messages";
import { deliver, type SubscriptionRow } from "@/lib/notifications/send";

/** At most one "we're open" push per this long, however often ordering is reopened. */
const COOLDOWN_MS = 3 * 60 * 60 * 1000;

/** A restaurant counts as fruit / juice by its cuisine tags. */
const FRUIT_TAG = /fruit|juice|sugarcane/i;

export type OpenPushResult =
  | { sent: true; students: number }
  | { sent: false; reason: "closed" | "no-restaurant" | "cooldown" | "error" };

/**
 * Tells every student who has notifications on (and hasn't muted "When
 * ordering opens") that ordering is open, with a rotating message
 * (open-messages.ts). Called from the admin's Open switch AND from turning
 * a restaurant on: it only fires once ordering is open AND at least one
 * restaurant is taking orders — Closed turns every restaurant off and
 * reopening leaves them off, so pinging at the switch alone would send
 * students to closed menus. The 3-hour slot is claimed with one
 * conditional update, so two quick taps can't both send. Banned students
 * (by account or by a banned phone) and admins are left out. Delivery runs
 * in after(); this never throws.
 *
 * `supabase` is the admin's own session — admins can read every
 * subscription and user row (RLS).
 */
export async function notifyOrderingOpen(supabase: SupabaseClient): Promise<OpenPushResult> {
  try {
    const [{ data: settings }, { data: active }] = await Promise.all([
      supabase.from("app_settings").select("ordering_mode, recent_open_messages").eq("id", true).maybeSingle(),
      supabase.from("restaurants").select("id, cuisine_tags").eq("is_active", true),
    ]);
    if (!settings || settings.ordering_mode !== "open") return { sent: false, reason: "closed" };
    if (!active || active.length === 0) return { sent: false, reason: "no-restaurant" };

    // Claim the slot: only succeeds if the last push is older than 3 hours.
    const now = new Date();
    const cutoff = new Date(now.getTime() - COOLDOWN_MS).toISOString();
    const { data: claimed } = await supabase
      .from("app_settings")
      .update({ last_open_push_at: now.toISOString() })
      .eq("id", true)
      .or(`last_open_push_at.is.null,last_open_push_at.lt.${cutoff}`)
      .select("id");
    if (!claimed || claimed.length === 0) return { sent: false, reason: "cooldown" };

    // Fruit / juice messages only while such a restaurant is on and sells something.
    const fruitIds = active.filter((r) => (r.cuisine_tags ?? []).some((t: string) => FRUIT_TAG.test(t))).map((r) => r.id);
    let fruitOn = false;
    if (fruitIds.length > 0) {
      const { count } = await supabase
        .from("dishes")
        .select("id", { count: "exact", head: true })
        .in("restaurant_id", fruitIds)
        .eq("is_available", true);
      fruitOn = (count ?? 0) > 0;
    }

    const offers = await getOffers();
    const offerPct = offers.active.includes("pct20") ? 20 : offers.active.includes("pct10") ? 10 : null;
    const recent: number[] = settings.recent_open_messages ?? [];
    const message = pickOpenMessage({ now, recent, fruitOn, offerPct });

    const [{ data: subs }, { data: banned }] = await Promise.all([
      supabase
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth, user_id, users!inner(role, is_banned, phone)")
        .eq("notify_open", true)
        .returns<(SubscriptionRow & { user_id: string; users: { role: string; is_banned: boolean; phone: string } })[]>(),
      supabase.from("users").select("phone").eq("is_banned", true),
    ]);
    const bannedPhones = new Set((banned ?? []).map((u) => u.phone));
    const rows = (subs ?? []).filter(
      (s) => s.users.role !== "admin" && !s.users.is_banned && !bannedPhones.has(s.users.phone),
    );

    await supabase
      .from("app_settings")
      .update({ recent_open_messages: [message.id, ...recent.filter((id) => id !== message.id)].slice(0, RECENT_LIMIT) })
      .eq("id", true);

    after(() =>
      deliver(
        supabase,
        rows.map(({ id, endpoint, p256dh, auth }) => ({ id, endpoint, p256dh, auth })),
        { title: message.title, body: message.body, url: "/", tag: "ordering-open" },
      ),
    );
    return { sent: true, students: new Set(rows.map((r) => r.user_id)).size };
  } catch (error) {
    console.error("ordering-open push failed", error);
    return { sent: false, reason: "error" };
  }
}
