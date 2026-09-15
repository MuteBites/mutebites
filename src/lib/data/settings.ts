import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * The campus-wide ordering kill switch (public.app_settings, single row).
 * Public-read — both the student app (to show the paused banner and grey
 * out ordering) and the admin dashboard (to show/flip the switch) need it.
 */
export async function getOrderingEnabled(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("ordering_enabled")
    .eq("id", true)
    .single();

  if (error) throw error;
  return data.ordering_enabled;
}
