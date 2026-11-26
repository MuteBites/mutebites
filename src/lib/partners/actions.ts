"use server";

import { formatRupees } from "@/lib/format";
import { MAX_NOTES } from "@/lib/cart/limits";
import {
  PARTNER_MAX_ITEMS,
  PARTNER_MAX_TOTAL,
  partnerOf,
  type PartnerOrderPayload,
} from "@/lib/partners";
import { signPartnerOrder } from "@/lib/partners/sign";
import { formatStoredMobile } from "@/lib/phone";
import { SITE_URL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export type PartnerOrderResult =
  | { ok: true; url: string }
  | { ok: false; error: string; removedDishIds?: string[]; updatedPrices?: { dishId: string; price: number }[] };

/**
 * A Spice Magic (partner) order: checks it the way place_order() would —
 * signed in, profile, not banned, the restaurant on, every dish its own and
 * on sale, prices from the database (never the phone), the caps — and
 * returns FoodHub's wa.me link with the order typed out and a signed verify
 * link. Nothing is saved anywhere (by decision): the student taps Send in
 * WhatsApp and FoodHub takes it from there.
 */
export async function preparePartnerOrder(input: {
  restaurantId: string;
  lines: { dishId: string; quantity: number }[];
  notes: string;
}): Promise<PartnerOrderResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in again to order." };

  const [{ data: profile }, { data: restaurant }, banned] = await Promise.all([
    supabase.from("users").select("full_name, phone, is_banned").eq("id", user.id).maybeSingle(),
    supabase
      .from("restaurants")
      .select("id, name, is_active, archived_at")
      .eq("id", input.restaurantId)
      .maybeSingle(),
    supabase.rpc("current_user_is_banned"),
  ]);
  if (!profile) return { ok: false, error: "Finish your profile first." };
  if (profile.is_banned || banned.data === true) {
    return { ok: false, error: "Your account can't place orders. Contact MuteBites support." };
  }
  const partner = partnerOf(restaurant?.name);
  if (!restaurant || !partner || restaurant.archived_at) return { ok: false, error: "This restaurant isn't available." };
  if (!restaurant.is_active) return { ok: false, error: `${restaurant.name} is closed right now.` };

  const qty = new Map<string, number>();
  for (const l of input.lines) {
    if (typeof l.dishId !== "string" || !Number.isInteger(l.quantity) || l.quantity < 1 || l.quantity > 20) {
      return { ok: false, error: "Something's off with your cart. Remove a dish and add it again." };
    }
    qty.set(l.dishId, (qty.get(l.dishId) ?? 0) + l.quantity);
  }
  if (qty.size === 0) return { ok: false, error: "Your cart is empty." };

  const { data: dishes } = await supabase
    .from("dishes")
    .select("id, name, price, is_available, sort_order")
    .eq("restaurant_id", restaurant.id)
    .in("id", [...qty.keys()]);
  const byId = new Map((dishes ?? []).map((d) => [d.id, d]));
  const removed = [...qty.keys()].filter((id) => !byId.get(id)?.is_available);
  if (removed.length > 0) {
    return { ok: false, error: "Some dishes just sold out. We took them out of your cart.", removedDishIds: removed };
  }

  const items: [string, number, number][] = [...qty].map(([id, q]) => {
    const d = byId.get(id)!;
    return [d.name, q, d.price];
  });
  const count = items.reduce((n, [, q]) => n + q, 0);
  const total = items.reduce((n, [, q, p]) => n + q * p, 0);
  if (count > PARTNER_MAX_ITEMS || total > PARTNER_MAX_TOTAL) {
    return {
      ok: false,
      error: `For bigger orders (over ${PARTNER_MAX_ITEMS} items or ${formatRupees(PARTNER_MAX_TOTAL)}), message ${partner.brand} directly.`,
    };
  }

  const note = input.notes.trim().replace(/\s+/g, " ").slice(0, MAX_NOTES);
  const payload: PartnerOrderPayload = {
    v: 1,
    r: restaurant.name,
    i: items,
    t: total,
    n: profile.full_name,
    p: profile.phone,
    o: note,
    s: Date.now(),
  };
  const token = signPartnerOrder(payload);

  const text = [
    `*New order · ${restaurant.name}*`,
    `_via MuteBites_`,
    "",
    ...items.map(([name, q, p]) => `${name} - ${q} · ${formatRupees(q * p)}`),
    "",
    `*Total: ${formatRupees(total)}*`,
    ...(note ? [`Note: ${note}`] : []),
    "",
    `Name: ${profile.full_name}`,
    `Phone: ${formatStoredMobile(profile.phone)}`,
    ...(token ? ["", `Verify: ${SITE_URL}/v/${token}`] : []),
  ].join("\n");

  return { ok: true, url: `https://wa.me/${partner.whatsapp}?text=${encodeURIComponent(text)}` };
}
