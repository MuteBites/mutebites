import { cache } from "react";
import { SPECIAL_PRICE } from "@/lib/partners";
import { createClient } from "@/lib/supabase/server";

/** Whether Spice Magic's ₹170 offer is on (deal_switches, public-read). Errors read as off. */
export const getSpecialPriceOn = cache(async (): Promise<boolean> => {
  const supabase = await createClient();
  const { data } = await supabase.from("deal_switches").select("enabled").eq("key", SPECIAL_PRICE.key).maybeSingle();
  return data?.enabled === true;
});
