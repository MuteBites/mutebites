import { cache } from "react";
import { SPECIAL_PRICE, specialPriceLive } from "@/lib/partners";
import { createClient } from "@/lib/supabase/server";

/** Whether Spice Magic's ₹170 offer is live: its switch (deal_switches, public-read) and today only. Errors read as off. */
export const getSpecialPriceOn = cache(async (): Promise<boolean> => {
  const supabase = await createClient();
  const { data } = await supabase.from("deal_switches").select("enabled").eq("key", SPECIAL_PRICE.key).maybeSingle();
  return specialPriceLive(data?.enabled === true);
});
