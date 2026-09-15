import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Dish, DishCategory, MenuSection, Restaurant } from "./types";

/** All restaurants for the student home screen — open ones first. */
export async function getRestaurants(): Promise<Restaurant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, phone, description, cuisine_tags, is_active")
    .order("is_active", { ascending: false })
    .order("name");

  if (error) throw error;
  return data;
}

/**
 * One restaurant plus its menu grouped into sections, or null if it
 * doesn't exist. Sold-out dishes are included (shown, not addable).
 */
// cache(): generateMetadata and the page both ask for the same menu.
export const getRestaurantMenu = cache(async function getRestaurantMenu(
  id: string,
): Promise<{ restaurant: Restaurant; sections: MenuSection[] } | null> {
  const supabase = await createClient();

  const [restaurantResult, categoriesResult, dishesResult] = await Promise.all([
    supabase
      .from("restaurants")
      .select("id, name, phone, description, cuisine_tags, is_active")
      .eq("id", id)
      .maybeSingle<Restaurant>(),
    supabase
      .from("dish_categories")
      .select("id, restaurant_id, name, sort_order")
      .eq("restaurant_id", id)
      .order("sort_order")
      .order("name")
      .returns<DishCategory[]>(),
    supabase
      .from("dishes")
      .select("id, restaurant_id, category_id, name, price, is_veg, note, is_available, sort_order")
      .eq("restaurant_id", id)
      .order("sort_order")
      .order("name")
      .returns<Dish[]>(),
  ]);

  if (restaurantResult.error) throw restaurantResult.error;
  if (categoriesResult.error) throw categoriesResult.error;
  if (dishesResult.error) throw dishesResult.error;

  const restaurant = restaurantResult.data;
  if (!restaurant) return null;

  const categories = categoriesResult.data ?? [];
  const dishes = dishesResult.data ?? [];

  const sections: MenuSection[] = categories
    .map((category) => ({
      category,
      dishes: dishes.filter((d) => d.category_id === category.id),
    }))
    .filter((s) => s.dishes.length > 0);

  const uncategorized = dishes.filter(
    (d) => !d.category_id || !categories.some((c) => c.id === d.category_id),
  );
  if (uncategorized.length > 0) sections.push({ category: null, dishes: uncategorized });

  return { restaurant, sections };
});
