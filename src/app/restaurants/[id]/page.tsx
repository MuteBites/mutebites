import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { ArrowLeft } from "lucide-react";
import { BlurImage } from "@/components/blur-image";
import { MenuProgress } from "@/components/menu/menu-progress";
import { MenuView } from "@/components/menu/menu-view";
import { getRestaurantCoverPhoto } from "@/lib/data/dish-photos";
import { getDishesTried, getFavoriteDishId } from "@/lib/data/orders";
import { getRestaurantMenu } from "@/lib/data/restaurants";
import { getOrderingEnabled } from "@/lib/data/settings";
import { NAV_TRANSITION, REVEAL_ENTER } from "@/lib/nav-transition";
import { requireProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: PageProps<"/restaurants/[id]">): Promise<Metadata> {
  const { id } = await params;
  const menu = await getRestaurantMenu(id);
  return { title: menu ? `${menu.restaurant.name} · MuteBites` : "MuteBites" };
}

export default async function RestaurantPage({ params }: PageProps<"/restaurants/[id]">) {
  const profile = await requireProfile();
  const { id } = await params;
  const [menu, orderingEnabled, dishesTried, favoriteDishId] = await Promise.all([
    getRestaurantMenu(id),
    getOrderingEnabled(),
    getDishesTried(profile.id, id),
    getFavoriteDishId(profile.id, id),
  ]);
  if (!menu) notFound();

  const { restaurant, sections } = menu;
  const active = restaurant.is_active;
  const orderable = active && orderingEnabled;
  const paused = active && !orderingEnabled;
  const totalDishes = sections.reduce((sum, s) => sum + s.dishes.length, 0);
  const cover = getRestaurantCoverPhoto(restaurant.name);
  const statusBadge = (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold",
        orderable ? "bg-success-soft text-success" : "bg-secondary text-muted-foreground",
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", orderable ? "bg-success" : "bg-muted-foreground")}
        aria-hidden="true"
      />
      {!active ? "CLOSED" : paused ? "PAUSED" : "OPEN"}
    </span>
  );

  return (
    <main className="mx-auto w-full max-w-md">
      <ViewTransition {...NAV_TRANSITION}>
        <ViewTransition {...REVEAL_ENTER}>
          <div className={cn("relative aspect-[2/1] bg-stripes", !active && "grayscale")}>
            {cover && (
              <BlurImage
                src={cover}
                alt=""
                sizes="(min-width: 448px) 448px, 100vw"
                className="object-cover"
              />
            )}
            {cover && (
              <div
                className="absolute inset-x-0 bottom-0 h-2/3"
                style={{ background: "linear-gradient(to top, rgb(0 0 0 / 70%), transparent)" }}
                aria-hidden="true"
              />
            )}
            <Link
              href="/"
              aria-label="Back to restaurants"
              transitionTypes={["nav-back"]}
              className="absolute top-4 left-4 flex size-12 items-center justify-center rounded-full bg-card shadow-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <ArrowLeft className="size-5" />
            </Link>
            {cover && <div className="absolute top-4 right-4">{statusBadge}</div>}
            {cover && (
              <h1 className="absolute bottom-4 left-6 font-heading text-3xl leading-tight font-bold tracking-tight text-white">
                {restaurant.name}
              </h1>
            )}
          </div>

          <div className="px-6">
            <header className="pt-5 pb-3">
              {!cover && (
                <div className="flex items-start justify-between gap-3">
                  <h1 className="font-heading text-3xl leading-tight font-bold tracking-tight">
                    {restaurant.name}
                  </h1>
                  <div className="mt-1">{statusBadge}</div>
                </div>
              )}
              <p className="mt-1.5 text-muted-foreground">
                {[restaurant.description, "Free delivery"].filter(Boolean).join(" · ")}
              </p>
              <MenuProgress restaurantName={restaurant.name} tried={dishesTried} total={totalDishes} />
              {!active && (
                <p className="mt-4 rounded-2xl bg-secondary px-4 py-3 text-sm">
                  <strong className="font-semibold">Closed right now.</strong> You can browse the
                  menu — ordering opens when they&apos;re back.
                </p>
              )}
              {paused && (
                <p className="mt-4 rounded-2xl bg-secondary px-4 py-3 text-sm">
                  <strong className="font-semibold">Ordering is paused right now.</strong> You can
                  browse the menu — try again in a bit.
                </p>
              )}
            </header>

            <MenuView
              restaurant={restaurant}
              sections={sections}
              profilePhone={profile.phone}
              orderingEnabled={orderingEnabled}
              favoriteDishId={favoriteDishId}
            />
          </div>
        </ViewTransition>
      </ViewTransition>
    </main>
  );
}
