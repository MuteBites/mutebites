"use server";

import { revalidatePath, updateTag } from "next/cache";
import { assertAdmin } from "@/lib/admin/assert";
import { isUuid } from "@/lib/ids";
import { FULL_BIRYANI_SECTIONS, SINGLE_BIRYANI_SECTION } from "@/lib/offers";
import { normalizeIndianMobile } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";
import { SUPPORT_PHONE } from "@/lib/support";
import { MENU_LIMITS } from "@/lib/admin/menu-limits";
import { MENU_PHOTOS_TAG } from "@/lib/data/uploaded-photos";

// The admin's own menu editing (/admin/menus): add restaurants, sections
// and dishes, edit and reorder them. RLS already lets admins write
// restaurants / dish_categories / dishes (public.is_admin()); assertAdmin()
// is the friendly early exit. Every change shows on student menus at once.

export type MenuActionResult = { ok: true; id?: string } | { ok: false; error: string };

const OFFER_SECTIONS = [...FULL_BIRYANI_SECTIONS, SINGLE_BIRYANI_SECTION];

function refresh() {
  updateTag(MENU_PHOTOS_TAG); // uploaded photos are keyed by name, so renames count too
  revalidatePath("/", "layout"); // Home, menus, search, admin pages
}

const PHOTO_BUCKET = "menu-photos";

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const v = value.replace(/\s+/g, " ").trim();
  return v.length > 0 && v.length <= max ? v : null;
}

function optionalText(value: unknown, max: number): string | null | false {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return false;
  const v = value.replace(/\s+/g, " ").trim();
  if (v.length === 0) return null;
  return v.length <= max ? v : false;
}

function cleanTags(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const tags = [...new Set(value.map((t) => (typeof t === "string" ? t.replace(/\s+/g, " ").trim() : "")).filter(Boolean))];
  if (tags.length > MENU_LIMITS.tags || tags.some((t) => t.length > MENU_LIMITS.tag)) return null;
  return tags;
}

/** Is this section one the biryani offer matches by name (at the offer restaurant)? */
async function isOfferSection(supabase: Awaited<ReturnType<typeof createClient>>, sectionId: string) {
  const { data } = await supabase
    .from("dish_categories")
    .select("name, restaurant_id")
    .eq("id", sectionId)
    .maybeSingle();
  if (!data || !OFFER_SECTIONS.includes(data.name)) return false;
  const { data: settings } = await supabase.from("app_settings").select("offers_restaurant_id").eq("id", true).maybeSingle();
  return settings?.offers_restaurant_id === data.restaurant_id;
}

// Restaurants -------------------------------------------------------------

export type RestaurantInput = {
  name: string;
  description: string;
  cuisineTags: string[];
  phone: string;
};

function parseRestaurant(input: RestaurantInput) {
  const name = cleanText(input?.name, MENU_LIMITS.name);
  if (!name) return { error: `Give the restaurant a name (up to ${MENU_LIMITS.name} characters).` };
  const description = optionalText(input.description, MENU_LIMITS.description);
  if (description === false) return { error: `Keep the description under ${MENU_LIMITS.description} characters.` };
  const cuisineTags = cleanTags(input.cuisineTags);
  if (!cuisineTags) return { error: `Up to ${MENU_LIMITS.tags} cuisine tags, each under ${MENU_LIMITS.tag} characters.` };
  let phone = SUPPORT_PHONE;
  if (typeof input.phone === "string" && input.phone.trim()) {
    const normalized = normalizeIndianMobile(input.phone);
    if (!normalized) return { error: "That phone number doesn't look right. Use a 10-digit mobile number." };
    phone = normalized;
  }
  return { value: { name, description, cuisine_tags: cuisineTags, phone } };
}

async function nameTaken(supabase: Awaited<ReturnType<typeof createClient>>, name: string, exceptId?: string) {
  const { data } = await supabase.from("restaurants").select("id").ilike("name", name.replace(/[%_\\]/g, "\\$&"));
  return (data ?? []).some((r) => r.id !== exceptId);
}

/** Adds a restaurant, switched off until its menu is ready (turned on from the dashboard). */
export async function createRestaurant(input: RestaurantInput): Promise<MenuActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;
  const parsed = parseRestaurant(input);
  if ("error" in parsed) return { ok: false, error: parsed.error! };

  const supabase = await createClient();
  if (await nameTaken(supabase, parsed.value.name)) return { ok: false, error: "There's already a restaurant with that name." };
  const { data, error } = await supabase
    .from("restaurants")
    .insert({ ...parsed.value, is_active: false })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "Couldn't add the restaurant. Please try again." };

  refresh();
  return { ok: true, id: data.id };
}

export async function updateRestaurant(id: string, input: RestaurantInput): Promise<MenuActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;
  if (!isUuid(id)) return { ok: false, error: "Unknown restaurant." };
  const parsed = parseRestaurant(input);
  if ("error" in parsed) return { ok: false, error: parsed.error! };

  const supabase = await createClient();
  if (await nameTaken(supabase, parsed.value.name, id)) return { ok: false, error: "There's already a restaurant with that name." };
  const { error } = await supabase
    .from("restaurants")
    .update({ ...parsed.value, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: "Couldn't save the restaurant. Please try again." };

  refresh();
  return { ok: true };
}

// Sections ----------------------------------------------------------------

export async function createSection(restaurantId: string, name: string): Promise<MenuActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;
  const clean = cleanText(name, MENU_LIMITS.section);
  if (!isUuid(restaurantId)) return { ok: false, error: "Unknown restaurant." };
  if (!clean) return { ok: false, error: `Give the section a name (up to ${MENU_LIMITS.section} characters).` };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("dish_categories")
    .select("name, sort_order")
    .eq("restaurant_id", restaurantId);
  if ((existing ?? []).some((s) => s.name.toLowerCase() === clean.toLowerCase())) {
    return { ok: false, error: "This menu already has a section with that name." };
  }
  const sortOrder = Math.max(0, ...(existing ?? []).map((s) => s.sort_order)) + 1;
  const { data, error } = await supabase
    .from("dish_categories")
    .insert({ restaurant_id: restaurantId, name: clean, sort_order: sortOrder })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "Couldn't add the section. Please try again." };

  refresh();
  return { ok: true, id: data.id };
}

export async function renameSection(sectionId: string, name: string): Promise<MenuActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;
  const clean = cleanText(name, MENU_LIMITS.section);
  if (!isUuid(sectionId)) return { ok: false, error: "Unknown section." };
  if (!clean) return { ok: false, error: `Give the section a name (up to ${MENU_LIMITS.section} characters).` };

  const supabase = await createClient();
  if (await isOfferSection(supabase, sectionId)) {
    return { ok: false, error: "The biryani offer uses this section's name, so it can't be renamed here." };
  }
  const { data: section } = await supabase.from("dish_categories").select("restaurant_id").eq("id", sectionId).maybeSingle();
  if (!section) return { ok: false, error: "Unknown section." };
  const { data: siblings } = await supabase
    .from("dish_categories")
    .select("id, name")
    .eq("restaurant_id", section.restaurant_id);
  if ((siblings ?? []).some((s) => s.id !== sectionId && s.name.toLowerCase() === clean.toLowerCase())) {
    return { ok: false, error: "This menu already has a section with that name." };
  }
  const { error } = await supabase.from("dish_categories").update({ name: clean }).eq("id", sectionId);
  if (error) return { ok: false, error: "Couldn't rename the section. Please try again." };

  refresh();
  return { ok: true };
}

/** Removes an EMPTY section (move or delete its dishes first). */
export async function deleteSection(sectionId: string): Promise<MenuActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;
  if (!isUuid(sectionId)) return { ok: false, error: "Unknown section." };

  const supabase = await createClient();
  if (await isOfferSection(supabase, sectionId)) {
    return { ok: false, error: "The biryani offer uses this section, so it can't be deleted here." };
  }
  const { count } = await supabase.from("dishes").select("id", { count: "exact", head: true }).eq("category_id", sectionId);
  if ((count ?? 0) > 0) return { ok: false, error: "Move or delete this section's dishes first." };
  const { error } = await supabase.from("dish_categories").delete().eq("id", sectionId);
  if (error) return { ok: false, error: "Couldn't delete the section. Please try again." };

  refresh();
  return { ok: true };
}

/** Saves a new order for a restaurant's sections or a section's dishes (ids top to bottom). */
export async function reorderMenu(kind: "sections" | "dishes", ids: string[]): Promise<MenuActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;
  if ((kind !== "sections" && kind !== "dishes") || !Array.isArray(ids) || ids.length > 200 || !ids.every(isUuid)) {
    return { ok: false, error: "Couldn't reorder." };
  }

  const supabase = await createClient();
  const table = kind === "sections" ? "dish_categories" : "dishes";
  const results = await Promise.all(
    ids.map((id, i) => supabase.from(table).update({ sort_order: i + 1 }).eq("id", id)),
  );
  if (results.some((r) => r.error)) return { ok: false, error: "Couldn't save the new order. Please try again." };

  refresh();
  return { ok: true };
}

// Dishes ------------------------------------------------------------------

export type DishInput = {
  name: string;
  price: number;
  isVeg: boolean;
  note: string;
  categoryId: string;
  isAvailable: boolean;
};

function parseDish(input: DishInput) {
  const name = cleanText(input?.name, MENU_LIMITS.name);
  if (!name) return { error: `Give the dish a name (up to ${MENU_LIMITS.name} characters).` };
  const price = Number(input.price);
  if (!Number.isInteger(price) || price < 1 || price > MENU_LIMITS.price) {
    return { error: `Price must be a whole number of rupees, ₹1 to ₹${MENU_LIMITS.price}.` };
  }
  const note = optionalText(input.note, MENU_LIMITS.note);
  if (note === false) return { error: `Keep the note under ${MENU_LIMITS.note} characters.` };
  if (!isUuid(input.categoryId)) return { error: "Pick a section." };
  if (typeof input.isVeg !== "boolean" || typeof input.isAvailable !== "boolean") return { error: "Something's missing." };
  return {
    value: { name, price, is_veg: input.isVeg, note, category_id: input.categoryId, is_available: input.isAvailable },
  };
}

/** The section must belong to the restaurant; returns its restaurant id. */
async function sectionRestaurant(supabase: Awaited<ReturnType<typeof createClient>>, categoryId: string) {
  const { data } = await supabase.from("dish_categories").select("restaurant_id").eq("id", categoryId).maybeSingle();
  return data?.restaurant_id ?? null;
}

async function dishNameTaken(
  supabase: Awaited<ReturnType<typeof createClient>>,
  restaurantId: string,
  name: string,
  exceptId?: string,
) {
  const { data } = await supabase.from("dishes").select("id, name").eq("restaurant_id", restaurantId);
  return (data ?? []).some((d) => d.id !== exceptId && d.name.toLowerCase() === name.toLowerCase());
}

export async function createDish(restaurantId: string, input: DishInput): Promise<MenuActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;
  if (!isUuid(restaurantId)) return { ok: false, error: "Unknown restaurant." };
  const parsed = parseDish(input);
  if ("error" in parsed) return { ok: false, error: parsed.error! };

  const supabase = await createClient();
  if ((await sectionRestaurant(supabase, parsed.value.category_id)) !== restaurantId) {
    return { ok: false, error: "Pick a section from this menu." };
  }
  if (await dishNameTaken(supabase, restaurantId, parsed.value.name)) {
    return { ok: false, error: "This menu already has a dish with that name." };
  }
  const { data: last } = await supabase
    .from("dishes")
    .select("sort_order")
    .eq("category_id", parsed.value.category_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data, error } = await supabase
    .from("dishes")
    .insert({ ...parsed.value, restaurant_id: restaurantId, sort_order: (last?.sort_order ?? 0) + 1 })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "Couldn't add the dish. Please try again." };

  refresh();
  return { ok: true, id: data.id };
}

export async function updateDish(dishId: string, input: DishInput): Promise<MenuActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;
  if (!isUuid(dishId)) return { ok: false, error: "Unknown dish." };
  const parsed = parseDish(input);
  if ("error" in parsed) return { ok: false, error: parsed.error! };

  const supabase = await createClient();
  const { data: dish } = await supabase.from("dishes").select("restaurant_id, category_id").eq("id", dishId).maybeSingle();
  if (!dish) return { ok: false, error: "Unknown dish." };
  if ((await sectionRestaurant(supabase, parsed.value.category_id)) !== dish.restaurant_id) {
    return { ok: false, error: "Pick a section from this menu." };
  }
  if (await dishNameTaken(supabase, dish.restaurant_id, parsed.value.name, dishId)) {
    return { ok: false, error: "This menu already has a dish with that name." };
  }
  // Moving to another section puts it at the end there.
  let sortOrder: number | undefined;
  if (dish.category_id !== parsed.value.category_id) {
    const { data: last } = await supabase
      .from("dishes")
      .select("sort_order")
      .eq("category_id", parsed.value.category_id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    sortOrder = (last?.sort_order ?? 0) + 1;
  }
  const { error } = await supabase
    .from("dishes")
    .update({ ...parsed.value, ...(sortOrder !== undefined && { sort_order: sortOrder }), updated_at: new Date().toISOString() })
    .eq("id", dishId);
  if (error) return { ok: false, error: "Couldn't save the dish. Please try again." };

  refresh();
  return { ok: true };
}

/**
 * Deletes a dish for good. Past orders keep its name and price (order
 * items are snapshots; dish_id goes null), hearts on it go with it.
 */
export async function deleteDish(dishId: string): Promise<MenuActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;
  if (!isUuid(dishId)) return { ok: false, error: "Unknown dish." };

  const supabase = await createClient();
  const { data: dish } = await supabase.from("dishes").select("photo_path").eq("id", dishId).maybeSingle();
  const { error } = await supabase.from("dishes").delete().eq("id", dishId);
  if (error) return { ok: false, error: "Couldn't delete the dish. Please try again." };
  if (dish?.photo_path) await supabase.storage.from(PHOTO_BUCKET).remove([dish.photo_path]);

  refresh();
  return { ok: true };
}

// Photos --------------------------------------------------------------------
// The browser shrinks the photo and uploads it straight to the menu-photos
// bucket with the admin's own session (Storage policies: admins only), at
// a new name each time ("dishes/<id>-<ms>.webp"), then calls one of these
// to point the row at it. The previous file is deleted. Passing null
// removes the uploaded photo (the name-matched file, if any, shows again).

async function setPhoto(
  table: "dishes" | "restaurants",
  column: "photo_path" | "cover_path",
  folder: "dishes" | "covers",
  id: string,
  path: string | null,
): Promise<MenuActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;
  if (!isUuid(id)) return { ok: false, error: "Unknown item." };
  if (path !== null && (typeof path !== "string" || !new RegExp(String.raw`^${folder}/${id}-[0-9]{10,13}\.(webp|jpg)$`).test(path))) {
    return { ok: false, error: "That upload didn't work. Please try again." };
  }

  const supabase = await createClient();
  const { data: row } = await supabase.from(table).select(column).eq("id", id).maybeSingle<Record<string, string | null>>();
  if (!row) return { ok: false, error: "Unknown item." };
  const { error } = await supabase.from(table).update({ [column]: path }).eq("id", id);
  if (error) return { ok: false, error: "Couldn't save the photo. Please try again." };
  const old = row[column];
  if (old && old !== path) await supabase.storage.from(PHOTO_BUCKET).remove([old]);

  refresh();
  return { ok: true };
}

export async function setDishPhoto(dishId: string, path: string | null): Promise<MenuActionResult> {
  return setPhoto("dishes", "photo_path", "dishes", dishId, path);
}

export async function setRestaurantCover(restaurantId: string, path: string | null): Promise<MenuActionResult> {
  return setPhoto("restaurants", "cover_path", "covers", restaurantId, path);
}
