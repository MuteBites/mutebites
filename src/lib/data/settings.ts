import "server-only";

import { describeOrdering, toOrderingMode, type OrderingState } from "@/lib/ordering";
import { createClient } from "@/lib/supabase/server";

/**
 * Whether students can order right now, and what to tell them if not.
 * `open` comes straight from public.ordering_is_open() — the same function
 * place_order() enforces — so the UI can't drift from the database.
 */
export async function getOrderingState(): Promise<OrderingState> {
  const supabase = await createClient();
  const [settings, open] = await Promise.all([
    supabase.from("app_settings").select("ordering_mode").eq("id", true).single(),
    supabase.rpc("ordering_is_open"),
  ]);

  if (settings.error) throw settings.error;
  if (open.error) throw open.error;
  const isOpen = open.data === true;
  return describeOrdering(toOrderingMode(settings.data.ordering_mode, isOpen), isOpen);
}
