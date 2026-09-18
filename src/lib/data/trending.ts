import "server-only";

import { createClient } from "@/lib/supabase/server";

export type TrendingDish = {
  dishId: string;
  dishName: string;
  restaurantId: string;
  restaurantName: string;
  orderCount: number;
};

type TrendingDishRow = {
  dish_id: string;
  dish_name: string;
  restaurant_id: string;
  restaurant_name: string;
  order_count: number;
};

/** Top ordered dishes campus-wide over the last 7 days, for Home's "Trending this week" leaderboard. */
export async function getTrendingDishes(limit = 5): Promise<TrendingDish[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("trending_dishes", { result_limit: limit });

  if (error) throw error;
  return ((data ?? []) as TrendingDishRow[]).map((d) => ({
    dishId: d.dish_id,
    dishName: d.dish_name,
    restaurantId: d.restaurant_id,
    restaurantName: d.restaurant_name,
    // bigint in Postgres — coerce in case it ever arrives as a string.
    orderCount: Number(d.order_count),
  }));
}
