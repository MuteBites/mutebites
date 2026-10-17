import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { BackToDashboardLink } from "@/components/admin/back-to-dashboard-link";
import { MenuEditor } from "@/components/admin/menus/menu-editor";
import { RestaurantFormDialog } from "@/components/admin/menus/restaurant-form-dialog";
import { adminPill } from "@/components/admin/styles";
import { getAdminMenu } from "@/lib/data/admin-menus";
import { DISH_PHOTOS, getRestaurantCoverPhoto } from "@/lib/data/dish-photos";
import { getOffers } from "@/lib/data/offers";
import { FULL_BIRYANI_SECTIONS, SINGLE_BIRYANI_SECTION } from "@/lib/offers";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Edit menu · MuteBites Admin" };

/** One restaurant's details and its whole menu, editable. */
export default async function AdminMenuPage({ params }: PageProps<"/admin/menus/[id]">) {
  const { id } = await params;
  const [menu, offers] = await Promise.all([getAdminMenu(id), getOffers()]);
  if (!menu) notFound();

  const { restaurant, sections } = menu;
  const dishCount = sections.reduce((n, s) => n + s.dishes.length, 0) + menu.loose.length;
  const photoDishNames = Object.keys(DISH_PHOTOS[restaurant.name] ?? {});
  const hasPhotos = !!getRestaurantCoverPhoto(restaurant.name) || photoDishNames.length > 0;
  const offerSections = [...FULL_BIRYANI_SECTIONS, SINGLE_BIRYANI_SECTION];
  const lockedSectionIds =
    offers.restaurantId === restaurant.id
      ? sections.filter((s) => offerSections.includes(s.name)).map((s) => s.id)
      : [];

  return (
    <>
      <div>
        <BackToDashboardLink href="/admin/menus" label="Menus" />
        <h1 className="mt-4 font-heading text-headline font-bold">{restaurant.name}</h1>
        <p className="mt-1 text-muted-foreground">
          {dishCount === 1 ? "1 dish" : `${dishCount} dishes`} ·{" "}
          {restaurant.isActive ? "Open" : "Closed (turn it on from the dashboard)"}
        </p>
        {restaurant.cuisineTags.length > 0 && (
          <p className="mt-2 flex flex-wrap gap-1.5">
            {restaurant.cuisineTags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-brand-soft px-2.5 py-0.5 text-sm font-medium text-brand-soft-foreground"
              >
                {t}
              </span>
            ))}
          </p>
        )}
      </div>

      <RestaurantFormDialog
        restaurant={restaurant}
        hasPhotos={hasPhotos}
        trigger={
          <button type="button" className={cn(adminPill, "w-fit")}>
            <Pencil className="size-4" aria-hidden="true" />
            Edit details
          </button>
        }
      />

      <MenuEditor menu={menu} lockedSectionIds={lockedSectionIds} photoDishNames={photoDishNames} />
    </>
  );
}
