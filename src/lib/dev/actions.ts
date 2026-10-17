"use server";

import { revalidatePath } from "next/cache";
import type { SiteMode } from "@/lib/site-status/offline-page";
import { createClient } from "@/lib/supabase/server";

export type DevActionResult = { ok: true } | { ok: false; error: string };

const MODES: SiteMode[] = ["live", "killed", "maintenance"];
const MAX_SITE_MESSAGE = 300;

/**
 * Flips the whole site live / killed / maintenance. public.set_site_mode()
 * is the boundary — it refuses anyone not in public.developers — so this
 * only validates the shape and maps the error.
 */
export async function setSiteMode(mode: SiteMode, message: string | null): Promise<DevActionResult> {
  if (!MODES.includes(mode)) return { ok: false, error: "Unknown mode." };
  const text = message?.trim() || null;
  if (text && text.length > MAX_SITE_MESSAGE) {
    return { ok: false, error: `Keep the message under ${MAX_SITE_MESSAGE} characters.` };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_site_mode", { p_mode: mode, p_message: text });
  if (error) {
    return {
      ok: false,
      error: error.message.includes("not_developer")
        ? "Only developers can change this."
        : "Couldn't save that — try again.",
    };
  }
  revalidatePath("/dev");
  return { ok: true };
}
