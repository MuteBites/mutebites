import { cache } from "react";
import type { PartnerOrder } from "@/lib/partners";
import { isUuid } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";

type Row = {
  id: string;
  restaurant_name: string;
  items: { name: string; quantity: number; price: number }[];
  total_amount: number;
  notes: string | null;
  created_at: string;
};

const COLUMNS = "id, restaurant_name, items, total_amount, notes, created_at";

function toOrder(r: Row): PartnerOrder {
  return {
    id: r.id,
    restaurantName: r.restaurant_name,
    items: Array.isArray(r.items) ? r.items : [],
    totalAmount: r.total_amount,
    notes: r.notes,
    createdAt: r.created_at,
  };
}

/** The student's Spice Magic (FoodHub collab) orders, newest first. Errors read as none. */
export const getPartnerOrders = cache(async (userId: string): Promise<PartnerOrder[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("partner_orders")
    .select(COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<Row[]>();
  return (data ?? []).map(toOrder);
});

/** One of the student's own partner orders (RLS keeps it theirs), or null. */
export async function getPartnerOrder(id: string): Promise<PartnerOrder | null> {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("partner_orders").select(COLUMNS).eq("id", id).maybeSingle<Row>();
  return data ? toOrder(data) : null;
}
