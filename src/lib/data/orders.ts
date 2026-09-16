import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_STATUSES } from "@/lib/orders/status";
import type { OrderStatus } from "./types";

export type OrderSummary = {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  restaurantId: string;
  restaurantName: string;
  itemCount: number;
  /** e.g. "2× Chicken Biryani, Veg Manchurian" — for the orders list, not the detail page. */
  itemsSummary: string;
  dailyNumber: number;
};

export type OrderItem = { dishName: string; unitPrice: number; quantity: number; subtotal: number };

export type OrderDetail = {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  contactPhone: string;
  notes: string | null;
  restaurantId: string;
  restaurantName: string;
  restaurantPhone: string;
  items: OrderItem[];
  dailyNumber: number;
};

type OrderSummaryRow = {
  id: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  restaurant_id: string;
  restaurants: { name: string } | null;
  order_items: { dish_name: string; quantity: number }[];
  daily_number: number;
};

function summarizeItems(items: { dish_name: string; quantity: number }[]): string {
  return items.map((i) => (i.quantity > 1 ? `${i.quantity}× ${i.dish_name}` : i.dish_name)).join(", ");
}

/**
 * The signed-in student's own orders, most recent first. RLS already
 * scopes reads to auth.uid() = user_id; the explicit filter here is
 * defense in depth, matching how profile.ts fetches its own row.
 */
export async function getOrderHistory(userId: string): Promise<OrderSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, status, total_amount, created_at, restaurant_id, restaurants(name), order_items(dish_name, quantity), daily_number",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<OrderSummaryRow[]>();

  if (error) throw error;

  return (data ?? []).map((o) => ({
    id: o.id,
    status: o.status,
    totalAmount: o.total_amount,
    createdAt: o.created_at,
    restaurantId: o.restaurant_id,
    restaurantName: o.restaurants?.name ?? "Restaurant",
    itemCount: o.order_items.reduce((sum, item) => sum + item.quantity, 0),
    itemsSummary: summarizeItems(o.order_items),
    dailyNumber: o.daily_number,
  }));
}

type OrderDetailRow = {
  id: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  updated_at: string;
  contact_phone: string;
  notes: string | null;
  restaurant_id: string;
  restaurants: { name: string; phone: string } | null;
  order_items: { dish_name: string; unit_price: number; quantity: number; subtotal: number }[];
  daily_number: number;
};

/**
 * All the profile screen's order-derived numbers in one query: "cravings
 * solved" (delivered orders), the milestone badges ("First Bite", "Regular",
 * "Campus Explorer"), and the "N pickups, N no-shows" line. There's no dedicated
 * no-show status — `cancelled` is the closest thing the schema tracks (an
 * admin cancels an order that isn't going to be collected), so it's used
 * as that proxy.
 */
export async function getOrderStats(userId: string): Promise<{
  deliveredCount: number;
  cancelledCount: number;
  restaurantsVisited: number;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("restaurant_id, status")
    .eq("user_id", userId);

  if (error) throw error;
  const rows = data ?? [];
  const delivered = rows.filter((r) => r.status === "delivered");
  const cancelled = rows.filter((r) => r.status === "cancelled");
  return {
    deliveredCount: delivered.length,
    cancelledCount: cancelled.length,
    restaurantsVisited: new Set(delivered.map((r) => r.restaurant_id)).size,
  };
}

/**
 * Distinct dishes the student has been delivered at one restaurant — the
 * menu page's "You've tried N of M" progress bar. Dishes ordered but
 * later removed from the menu (`dish_id` goes null on delete) don't
 * count, since they're not part of the current total either.
 */
export async function getDishesTried(userId: string, restaurantId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("order_items(dish_id)")
    .eq("user_id", userId)
    .eq("restaurant_id", restaurantId)
    .eq("status", "delivered")
    .returns<{ order_items: { dish_id: string | null }[] }[]>();

  if (error) throw error;
  const dishIds = (data ?? []).flatMap((o) => o.order_items.map((i) => i.dish_id));
  return new Set(dishIds.filter((id): id is string => id !== null)).size;
}

/**
 * True if the student has any order that hasn't reached delivered/cancelled
 * yet. Used to block phone-number edits while an order is in progress,
 * since the delivery contact number shouldn't change mid-order.
 */
export async function hasActiveOrder(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ACTIVE_STATUSES);

  if (error) throw error;
  return (count ?? 0) > 0;
}

/** One order with its restaurant + items, or null if it's not this student's. */
export const getOrder = cache(async function getOrder(
  id: string,
  userId: string,
): Promise<OrderDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, status, total_amount, created_at, updated_at, contact_phone, notes, restaurant_id, restaurants(name, phone), order_items(dish_name, unit_price, quantity, subtotal), daily_number",
    )
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle<OrderDetailRow>();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    status: data.status,
    totalAmount: data.total_amount,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    contactPhone: data.contact_phone,
    notes: data.notes,
    restaurantId: data.restaurant_id,
    restaurantName: data.restaurants?.name ?? "Restaurant",
    restaurantPhone: data.restaurants?.phone ?? "",
    items: data.order_items.map((i) => ({
      dishName: i.dish_name,
      unitPrice: i.unit_price,
      quantity: i.quantity,
      subtotal: i.subtotal,
    })),
    dailyNumber: data.daily_number,
  };
});
