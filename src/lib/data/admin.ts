import "server-only";

import { createClient } from "@/lib/supabase/server";
import { startOfTodayIST } from "@/lib/date";
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
 * `since` scopes all three to orders created at or after that instant —
 * the admin dashboard passes today's IST midnight, so these read as
 * "today's" counts, matching the order list below it.
 */
export async function getOrderCounts(since?: Date): Promise<OrderCounts> {
  const supabase = await createClient();
  const sinceIso = since?.toISOString();

  let totalQuery = supabase.from("orders").select("id", { count: "exact", head: true });
  let confirmedQuery = supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "confirmed");
  let completedQuery = supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "delivered");
  if (sinceIso) {
    totalQuery = totalQuery.gte("created_at", sinceIso);
    confirmedQuery = confirmedQuery.gte("created_at", sinceIso);
    completedQuery = completedQuery.gte("created_at", sinceIso);
  }

  const [total, confirmed, completed] = await Promise.all([totalQuery, confirmedQuery, completedQuery]);

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
  restaurantId: string;
  restaurantName: string;
  userId: string;
  studentName: string;
  studentBanned: boolean;
  items: { dishName: string; quantity: number }[];
  dailyNumber: number;
};

type AdminOrderRow = {
  id: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  contact_phone: string;
  daily_number: number;
  notes: string | null;
  user_id: string;
  restaurant_id: string;
  restaurants: { name: string } | null;
  users: { full_name: string; is_banned: boolean } | null;
  order_items: { dish_name: string; quantity: number }[];
};

const ADMIN_ORDER_COLUMNS =
  "id, status, total_amount, created_at, contact_phone, notes, user_id, restaurant_id, restaurants(name), users(full_name, is_banned), order_items(dish_name, quantity), daily_number";

function toAdminOrder(o: AdminOrderRow): AdminOrder {
  return {
    id: o.id,
    status: o.status,
    totalAmount: o.total_amount,
    createdAt: o.created_at,
    contactPhone: o.contact_phone,
    notes: o.notes,
    userId: o.user_id,
    restaurantId: o.restaurant_id,
    restaurantName: o.restaurants?.name ?? "Restaurant",
    studentName: o.users?.full_name ?? "Student",
    studentBanned: o.users?.is_banned ?? false,
    items: o.order_items.map((i) => ({ dishName: i.dish_name, quantity: i.quantity })),
    dailyNumber: o.daily_number,
  };
}

/**
 * Today's orders (IST calendar day) across every student, for the main
 * admin dashboard's order list — the day resets are what "today" means to
 * whoever's standing at the gate, so this always matches their intuition
 * without needing a filter. See getAdminOrderHistory() for every past day.
 */
/**
 * Every `confirmed` order (any day), just id + placed-at — what the "Mark
 * all delivered" button needs to count eligible orders the same way
 * markAllConfirmedDelivered() does. The dashboard's order list is scoped to
 * today, so counting from it missed confirmed orders from earlier days that
 * the action would in fact deliver (and could leave the button disabled
 * while there was work to do).
 */
export async function getConfirmedOrderTimes(): Promise<{ id: string; createdAt: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("orders").select("id, created_at").eq("status", "confirmed");

  if (error) throw error;
  return (data ?? []).map((o) => ({ id: o.id, createdAt: o.created_at }));
}

export async function getAdminOrders(): Promise<AdminOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ADMIN_ORDER_COLUMNS)
    .gte("created_at", startOfTodayIST().toISOString())
    .order("created_at", { ascending: false })
    .returns<AdminOrderRow[]>();

  if (error) throw error;
  return (data ?? []).map(toAdminOrder);
}

// Capped so the history page stays cheap to load as order history grows —
// a "load more" / date-range picker can come later if needed.
const HISTORY_ORDERS_LIMIT = 2000;

/** Every order ever placed, most recent first — for the admin order-history page (grouped by day there). */
export async function getAdminOrderHistory(): Promise<AdminOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ADMIN_ORDER_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(HISTORY_ORDERS_LIMIT)
    .returns<AdminOrderRow[]>();

  if (error) throw error;
  return (data ?? []).map(toAdminOrder);
}

export type AdminUser = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  registrationNumber: string | null;
  isBanned: boolean;
  createdAt: string;
};

// Capped for the same reason as HISTORY_ORDERS_LIMIT above — keeps the
// Users page cheap to load as the student base grows.
const ALL_USERS_LIMIT = 5000;

/** Every registered student, most recently joined first — for the admin Users page. */
export async function getAllUsers(): Promise<AdminUser[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, phone, email, registration_number, is_banned, created_at")
    .order("created_at", { ascending: false })
    .limit(ALL_USERS_LIMIT);

  if (error) throw error;

  return (data ?? []).map((u) => ({
    id: u.id,
    fullName: u.full_name,
    phone: u.phone,
    email: u.email,
    registrationNumber: u.registration_number,
    isBanned: u.is_banned,
    createdAt: u.created_at,
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

export type AdminReview = {
  orderId: string;
  dailyNumber: number;
  restaurantId: string;
  restaurantName: string;
  studentName: string;
  note: string | null;
  createdAt: string;
  /** One per dish in the order. */
  ratings: { dishId: string | null; dishName: string; quantity: number; rating: number }[];
};

type AdminReviewRow = {
  order_id: string;
  note: string | null;
  created_at: string;
  users: { full_name: string } | null;
  orders: { daily_number: number; restaurant_id: string; restaurants: { name: string } | null } | null;
  order_item_ratings: {
    rating: number;
    dish_id: string | null;
    order_items: { dish_name: string; quantity: number } | null;
  }[];
};

// Capped like HISTORY_ORDERS_LIMIT — plenty for campus volume.
const REVIEWS_LIMIT = 1000;

/**
 * Every review, newest first — for /admin/reviews. Admin-only by RLS
 * (order_reviews / order_item_ratings are readable only by their author and
 * admins); students never see each other's reviews.
 */
export async function getAdminReviews(): Promise<AdminReview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_reviews")
    .select(
      "order_id, note, created_at, users(full_name), orders(daily_number, restaurant_id, restaurants(name)), order_item_ratings(rating, dish_id, order_items(dish_name, quantity))",
    )
    .order("created_at", { ascending: false })
    .limit(REVIEWS_LIMIT)
    .returns<AdminReviewRow[]>();

  if (error) throw error;
  return (data ?? []).map((r) => ({
    orderId: r.order_id,
    dailyNumber: r.orders?.daily_number ?? 0,
    restaurantId: r.orders?.restaurant_id ?? "",
    restaurantName: r.orders?.restaurants?.name ?? "Restaurant",
    studentName: r.users?.full_name ?? "Student",
    note: r.note,
    createdAt: r.created_at,
    ratings: r.order_item_ratings.map((x) => ({
      dishId: x.dish_id,
      dishName: x.order_items?.dish_name ?? "Dish",
      quantity: x.order_items?.quantity ?? 1,
      rating: x.rating,
    })),
  }));
}
