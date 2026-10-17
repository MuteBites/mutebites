"use client";

import { setUploadedPhotos, type UploadedPhotos as Photos } from "@/lib/data/dish-photos";

/**
 * Registers the admin's uploaded photos for getDishPhoto() /
 * getRestaurantCoverPhoto() in the browser. Rendered by the root layout
 * before the page, so it runs before anything that looks a photo up; it
 * re-renders (with the new set) when an admin edit refreshes the layout.
 */
export function UploadedPhotos({ photos }: { photos: Photos }) {
  setUploadedPhotos(photos);
  return null;
}
