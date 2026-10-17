import "server-only";

import { cache } from "react";
import { menuPhotoUrl, setUploadedPhotos, uploadedDishKey, type UploadedPhotos } from "@/lib/data/dish-photos";

/** Cache tag for the uploaded-photo index — menu-actions.ts expires it on every menu change. */
export const MENU_PHOTOS_TAG = "menu-photos";

const EMPTY: UploadedPhotos = { covers: {}, dishes: {} };

async function rest<T>(query: string): Promise<T[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  // A plain cached fetch (public-read tables, anon key, no cookies) so the
  // root layout can load it without making static pages dynamic. Kept
  // fresh by updateTag(MENU_PHOTOS_TAG) on admin edits, and every 5 minutes.
  const res = await fetch(`${url}/rest/v1/${query}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    next: { revalidate: 300, tags: [MENU_PHOTOS_TAG] },
  });
  if (!res.ok) return [];
  return res.json();
}

/**
 * Every uploaded dish photo and restaurant cover as public URLs, keyed the
 * way getDishPhoto() / getRestaurantCoverPhoto() look them up (by name).
 * Also registers them for this server's own lookups. Errors read as "no
 * uploads" — the name-matched files still show.
 */
export const getUploadedPhotos = cache(async (): Promise<UploadedPhotos> => {
  try {
    const [dishes, covers] = await Promise.all([
      rest<{ name: string; photo_path: string; restaurants: { name: string } | null }>(
        "dishes?select=name,photo_path,restaurants(name)&photo_path=not.is.null",
      ),
      rest<{ name: string; cover_path: string }>("restaurants?select=name,cover_path&cover_path=not.is.null"),
    ]);
    const photos: UploadedPhotos = {
      covers: Object.fromEntries(covers.map((r) => [r.name, menuPhotoUrl(r.cover_path)])),
      dishes: Object.fromEntries(
        dishes
          .filter((d) => d.restaurants)
          .map((d) => [uploadedDishKey(d.restaurants!.name, d.name), menuPhotoUrl(d.photo_path)]),
      ),
    };
    setUploadedPhotos(photos);
    return photos;
  } catch {
    return EMPTY;
  }
});
