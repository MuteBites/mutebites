import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { BackToDashboardLink } from "@/components/admin/back-to-dashboard-link";
import { RestaurantFormDialog } from "@/components/admin/menus/restaurant-form-dialog";
import { adminPill } from "@/components/admin/styles";
import { BlurImage } from "@/components/blur-image";
import { getAdminMenuRestaurants } from "@/lib/data/admin-menus";
import { getRestaurantCoverPhoto } from "@/lib/data/dish-photos";
import { getUploadedPhotos } from "@/lib/data/uploaded-photos";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Menus · MuteBites Admin" };

/**
 * Every restaurant, each opening its menu editor, plus "Add restaurant".
 * The admin keeps the menus themselves — no developer needed for a new
 * restaurant, section or dish (photos still go through the developer).
 */
export default async function AdminMenusPage() {
  const [restaurants] = await Promise.all([getAdminMenuRestaurants(), getUploadedPhotos()]);

  return (
    <>
      <div>
        <BackToDashboardLink />
        <h1 className="mt-4 font-heading text-headline font-bold">Menus</h1>
        <p className="mt-1 text-muted-foreground">
          Add a restaurant, or open one to add and edit its sections and dishes.
        </p>
      </div>

      <RestaurantFormDialog
        trigger={
          <button type="button" className={cn(adminPill, "w-fit")}>
            <Plus className="size-4" aria-hidden="true" />
            Add restaurant
          </button>
        }
      />

      <ul className="divide-y overflow-hidden rounded-[1.5rem] border bg-card shadow-card">
        {restaurants.map((r) => {
          const cover = getRestaurantCoverPhoto(r.name);
          return (
            <li key={r.id}>
              <Link
                href={`/admin/menus/${r.id}`}
                className="flex items-center gap-3.5 px-4 py-3 outline-none hover:bg-secondary/60 focus-visible:ring-3 focus-visible:ring-ring/80 focus-visible:ring-inset"
              >
                <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-stripes">
                  {cover && <BlurImage src={cover} alt="" sizes="48px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{r.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {r.dishCount === 1 ? "1 dish" : `${r.dishCount} dishes`} ·{" "}
                    {r.sectionCount === 1 ? "1 section" : `${r.sectionCount} sections`}
                  </span>
                </span>
                {r.dishCount === 0 && (
                  <span className="shrink-0 rounded-full bg-amber-soft px-2.5 py-0.5 text-xs font-semibold text-amber-soft-foreground">
                    Empty
                  </span>
                )}
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="text-sm text-muted-foreground">
        A restaurant with no dishes stays hidden from students. Turn restaurants on and off from the dashboard.
      </p>
    </>
  );
}
