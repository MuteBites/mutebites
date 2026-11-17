"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin/assert";
import { istDayKey } from "@/lib/date";
import { getSessionProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true } | { ok: false; error: string };

/** Block or unblock one of today's order numbers (More → Block order number). */
export async function setTokenBlocked(number: number, blocked: boolean): Promise<Result> {
  const denied = await assertAdmin();
  if (denied) return denied;
  if (!Number.isInteger(number) || number < 1 || number > 9999) {
    return { ok: false, error: "That isn't an order number." };
  }
  const supabase = await createClient();
  const day = istDayKey(new Date().toISOString());

  if (blocked) {
    const { data: counter } = await supabase
      .from("daily_order_counters")
      .select("last_number")
      .eq("order_day", day)
      .maybeSingle();
    if (counter && number <= counter.last_number) {
      return { ok: false, error: `Order #${number} is already taken today.` };
    }
    const { profile } = await getSessionProfile();
    const { error } = await supabase
      .from("blocked_tokens")
      .upsert({ day, number, blocked_by: profile?.id ?? null }, { onConflict: "day,number" });
    if (error) return { ok: false, error: "Couldn't block it. Try again." };
  } else {
    const { error } = await supabase.from("blocked_tokens").delete().eq("day", day).eq("number", number);
    if (error) return { ok: false, error: "Couldn't unblock it. Try again." };
  }

  revalidatePath("/admin/tokens");
  return { ok: true };
}
