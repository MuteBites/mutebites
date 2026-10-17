import "server-only";

import { isUuid } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";

export type AdminMenuRestaurant = {
  id: string;
  name: string;
  isActive: boolean;
  dishCount: number;
  sectionCount: number;
};

/** Every restaurant for /admin/menus, with how big its menu is. */
export async function getAdminMenuRestaurants(): Promise<AdminMenuRestaurant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, is_active, dishes(count), dish_categories(count)")
    .order("name")
    .returns<
      {
        id: string;
        name: string;
        is_active: boolean;
        dishes: { count: number }[];
        dish_categories: { count: number }[];
      }[]
    >();

  if (error) throw error;
  return data.map((r) => ({
    id: r.id,
    name: r.name,
    isActive: r.is_active,
    dishCount: r.dishes[0]?.count ?? 0,
    sectionCount: r.dish_categories[0]?.count ?? 0,
  }));
}

export type AdminMenuDish = {
  id: string;
  name: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  note: string | null;
  categoryId: string | null;
};

export type AdminMenuSection = { id: string; name: string; dishes: AdminMenuDish[] };

export type AdminMenu = {
  restaurant: {
    id: string;
    name: string;
    phone: string;
    description: string | null;
    cuisineTags: string[];
    isActive: boolean;
  };
  sections: AdminMenuSection[];
  /** Dishes with no section (none today, but category_id is nullable). */
  loose: AdminMenuDish[];
};

/**
 * One restaurant's whole menu for the editor — sold-out dishes included,
 * in the order students see it (section sort_order, then dish sort_order).
 * Null for a malformed or unknown id, so the page 404s.
 */
export async function getAdminMenu(id: string): Promise<AdminMenu | null> {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const [restaurant, sections, dishes] = await Promise.all([
    supabase
      .from("restaurants")
      .select("id, name, phone, description, cuisine_tags, is_active")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("dish_categories").select("id, name").eq("restaurant_id", id).order("sort_order").order("name"),
    supabase
      .from("dishes")
      .select("id, name, price, is_veg, is_available, note, category_id")
      .eq("restaurant_id", id)
      .order("sort_order")
      .order("name"),
  ]);

  if (restaurant.error) throw restaurant.error;
  if (sections.error) throw sections.error;
  if (dishes.error) throw dishes.error;
  if (!restaurant.data) return null;

  const all: AdminMenuDish[] = dishes.data.map((d) => ({
    id: d.id,
    name: d.name,
    price: Number(d.price),
    isVeg: d.is_veg,
    isAvailable: d.is_available,
    note: d.note,
    categoryId: d.category_id,
  }));
  const sectionIds = new Set(sections.data.map((s) => s.id));
  const r = restaurant.data;

  return {
    restaurant: {
      id: r.id,
      name: r.name,
      phone: r.phone,
      description: r.description,
      cuisineTags: r.cuisine_tags ?? [],
      isActive: r.is_active,
    },
    sections: sections.data.map((s) => ({ id: s.id, name: s.name, dishes: all.filter((d) => d.categoryId === s.id) })),
    loose: all.filter((d) => !d.categoryId || !sectionIds.has(d.categoryId)),
  };
}
