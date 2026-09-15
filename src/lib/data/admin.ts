import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "./types";

export type AdminRestaurant = { id: string; name: string; is_active: boolean };

/** Every restaurant, for the open/closed toggle list and the vendor stat. */
export async function getAdminRestaurants(): Promise<AdminRestaurant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, is_active")
    .order("name");

  if (error) throw error;
  return data;
}

export type OrderCounts = { total: number; confirmed: number; completed: number };

/**
 * Order counts for the stat cards. Counted rather than fetched in full, so
 * this stays cheap as order history grows. "Confirmed" is status =
 * 'confirmed' only (not preparing/out_for_delivery too) — those can become
 * their own stats later if needed. "Completed" is status = 'delivered'.
 */
export async function getOrderCounts(): Promise<OrderCounts> {
  const supabase = await createClient();
  const [total, confirmed, completed] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "delivered"),
  ]);

  if (total.error) throw total.error;
  if (confirmed.error) throw confirmed.error;
  if (completed.error) throw completed.error;

  return {
    total: total.count ?? 0,
    confirmed: confirmed.count ?? 0,
    completed: completed.count ?? 0,
  };
}

export type AdminOrder = {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  contactPhone: string;
  notes: string | null;
  restaurantName: string;
  userId: string;
  studentName: string;
  studentBanned: boolean;
  items: { dishName: string; quantity: number }[];
};

type AdminOrderRow = {
  id: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  contact_phone: string;
  notes: string | null;
  user_id: string;
  restaurants: { name: string } | null;
  users: { full_name: string; is_banned: boolean } | null;
  order_items: { dish_name: string; quantity: number }[];
};

// Newest first, capped so the dashboard stays cheap to load as order
// history grows — a "load more" / date filter can come later if needed.
const RECENT_ORDERS_LIMIT = 200;

/** Every order across every student, for the admin orders list. */
export async function getAdminOrders(): Promise<AdminOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, status, total_amount, created_at, contact_phone, notes, user_id, restaurants(name), users(full_name, is_banned), order_items(dish_name, quantity)",
    )
    .order("created_at", { ascending: false })
    .limit(RECENT_ORDERS_LIMIT)
    .returns<AdminOrderRow[]>();

  if (error) throw error;

  return (data ?? []).map((o) => ({
    id: o.id,
    status: o.status,
    totalAmount: o.total_amount,
    createdAt: o.created_at,
    contactPhone: o.contact_phone,
    notes: o.notes,
    userId: o.user_id,
    restaurantName: o.restaurants?.name ?? "Restaurant",
    studentName: o.users?.full_name ?? "Student",
    studentBanned: o.users?.is_banned ?? false,
    items: o.order_items.map((i) => ({ dishName: i.dish_name, quantity: i.quantity })),
  }));
}

export type BannedUser = {
  id: string;
  fullName: string;
  phone: string;
  bannedAt: string | null;
};

/** Everyone currently banned, most recently banned first. */
export async function getBannedUsers(): Promise<BannedUser[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, phone, banned_at")
    .eq("is_banned", true)
    .order("banned_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((u) => ({
    id: u.id,
    fullName: u.full_name,
    phone: u.phone,
    bannedAt: u.banned_at,
  }));
}
