import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CardSlide } from "@/lib/data/dish-photos";
import type { RestaurantMenuStats } from "@/lib/data/restaurants";
import type { Restaurant } from "@/lib/data/types";
import { formatRupees } from "@/lib/format";
import { partnerOf } from "@/lib/partners";
import { cn } from "@/lib/utils";
import { RestaurantPhotoSlides } from "./restaurant-photo-slides";

/*
 * Photo card: the cover, then the restaurant's dishes sliding past on
 * their own (RestaurantPhotoSlides), inset inside the card. Under it: the
 * name and description, cuisine chips in blush, and a footer with the dish
 * count and the starting price in amber. The glowing amber arrow is the
 * one action cue; the card lifts a little on hover. Free delivery is
 * campus-wide, so it's said once above the list, not on every card. No
 * star ratings: reviews are admin-only.
 */
export function RestaurantCard({
  restaurant,
  orderingEnabled,
  closedChip = "Closed",
  closedLine = "Ordering is closed right now",
  stats,
  slides,
  slideDelay,
  eager = false,
}: {
  restaurant: Restaurant;
  orderingEnabled: boolean;
  closedChip?: string;
  closedLine?: string;
  stats?: RestaurantMenuStats;
  /** getRestaurantCardSlides() — cover, then dish photos. */
  slides: CardSlide[];
  slideDelay?: number;
  /** The first card on Home: its cover is on screen at load, so load it now, at high priority. */
  eager?: boolean;
}) {
  const partner = partnerOf(restaurant.name);
  if (partner) {
    return (
      <PartnerCard
        restaurant={restaurant}
        brand={partner.brand}
        stats={stats}
        slides={slides}
        slideDelay={slideDelay}
        eager={eager}
      />
    );
  }
  const active = restaurant.is_active;
  // Fully orderable only when both this restaurant and the campus-wide
  // switch say yes. "paused" (active but the switch is off) gets its own
  // tag rather than being lumped in with "closed" — the restaurant itself
  // didn't do anything, campus ordering is just off right now.
  const open = active && orderingEnabled;
  const paused = active && !orderingEnabled;

  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      transitionTypes={["nav-forward"]}
      className="pressable group block rounded-[1.75rem] border bg-card p-2 shadow-card outline-none hover:-translate-y-0.5 hover:shadow-raised focus-visible:ring-3 focus-visible:ring-ring/80"
    >
      <div className={cn("h-44 overflow-hidden rounded-[1.25rem]", !active && "opacity-60 grayscale")}>
        <RestaurantPhotoSlides
          slides={slides}
          restaurantHref={`/restaurants/${restaurant.id}`}
          autoplay={active}
          startDelay={slideDelay}
          eager={eager}
        >
          <span
            className={cn(
              "pointer-events-none absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-card/90 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm",
              open ? "text-success" : "text-muted-foreground",
            )}
          >
            <span className="relative flex size-1.5" aria-hidden="true">
              {open && <span className="animate-ping-slow absolute inset-0 rounded-full bg-success" />}
              <span className={cn("relative size-1.5 rounded-full", open ? "bg-success" : "bg-muted-foreground")} />
            </span>
            {!active ? "Closed" : paused ? closedChip : "Open"}
          </span>
        </RestaurantPhotoSlides>
      </div>

      <div className="px-3 pt-3.5 pb-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-heading text-title font-bold">{restaurant.name}</h3>
            {restaurant.description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{restaurant.description}</p>
            )}
          </div>
          <span
            className={cn(
              "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full transition-transform duration-(--dur-base) ease-out-expo group-hover:translate-x-0.5",
              open ? "surface-primary glow-amber bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
            )}
            aria-hidden="true"
          >
            <ArrowRight className="size-4.5" />
          </span>
        </div>
        {restaurant.cuisine_tags.length > 0 && (
          <ul className="mt-3 flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            {restaurant.cuisine_tags.map((tag) => (
              <li key={tag} className="rounded-full bg-brand-soft px-2.5 py-1 text-brand-soft-foreground">
                {tag}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-3 flex items-baseline justify-between gap-3 border-t pt-3 text-sm">
          {open ? (
            stats && (
              <>
                <span className="text-muted-foreground">
                  {stats.dishCount} {stats.dishCount === 1 ? "dish" : "dishes"}
                </span>
                <span className="font-medium">
                  from <span className="font-heading text-base font-bold text-primary">{formatRupees(stats.minPrice)}</span>
                </span>
              </>
            )
          ) : (
            <span className="font-semibold">
              {!active ? "Closed right now · menu still browsable" : `${closedLine} · browse the menu`}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}

/**
 * Spice Magic's card (the MuteBites x FoodHub collab, 27 Nov 2026): FoodHub
 * pine, gold and MuteBites' blood plum merging (`.collab-wash`), a ring of
 * light circling the edge, a breathing halo and a sweep (`.collab-*` in
 * globals.css). Only its own Kitchen switch decides open / closed. Off: no
 * ring or halo, the photo greys like the others.
 */
function PartnerCard({
  restaurant,
  brand,
  stats,
  slides,
  slideDelay,
  eager,
}: {
  restaurant: Restaurant;
  brand: string;
  stats?: RestaurantMenuStats;
  slides: CardSlide[];
  slideDelay?: number;
  eager: boolean;
}) {
  const open = restaurant.is_active;
  return (
    <div className={cn(open ? "collab-card" : "rounded-[1.75rem]")}>
      {open && <span className="collab-ring" aria-hidden="true" />}
      <Link
        href={`/restaurants/${restaurant.id}`}
        transitionTypes={["nav-forward"]}
        className={cn(
          "collab-wash pressable group relative block overflow-hidden rounded-[calc(1.75rem-2px)] p-2 shadow-card outline-none hover:-translate-y-0.5 hover:shadow-raised focus-visible:ring-3 focus-visible:ring-hero-foreground/70",
          !open && "opacity-80",
        )}
      >
        {open && <span className="collab-sweep" aria-hidden="true" />}
        <div className={cn("relative h-44 overflow-hidden rounded-[1.25rem]", !open && "opacity-60 grayscale")}>
          <RestaurantPhotoSlides
            slides={slides}
            restaurantHref={`/restaurants/${restaurant.id}`}
            autoplay={open}
            startDelay={slideDelay}
            eager={eager}
          >
            <span className="pointer-events-none absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-hero px-2.5 py-1 text-xs font-semibold text-hero-accent">
              by {brand}
            </span>
            <span className="pointer-events-none absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-full bg-card/90 px-2.5 py-1 text-xs font-semibold text-foreground backdrop-blur-sm">
              <span className="relative flex size-1.5" aria-hidden="true">
                {open && <span className="animate-ping-slow absolute inset-0 rounded-full bg-success" />}
                <span className={cn("relative size-1.5 rounded-full", open ? "bg-success" : "bg-muted-foreground")} />
              </span>
              {open ? "Open" : "Closed"}
            </span>
          </RestaurantPhotoSlides>
        </div>

        <div className="relative px-3 pt-3.5 pb-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-hero-accent">MuteBites × {brand}</p>
              <h3 className="font-heading text-title font-bold">{restaurant.name}</h3>
              <p className="mt-0.5 text-sm text-hero-foreground/85">Order on {brand}&apos;s WhatsApp</p>
            </div>
            <span
              className={cn(
                "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full transition-transform duration-(--dur-base) ease-out-expo group-hover:translate-x-0.5",
                open ? "glow-amber bg-hero-accent text-hero" : "bg-hero-foreground/15",
              )}
              aria-hidden="true"
            >
              <ArrowRight className="size-4.5" />
            </span>
          </div>
          <p className="mt-3 flex items-baseline justify-between gap-3 border-t border-hero-foreground/20 pt-3 text-sm">
            {open ? (
              stats && (
                <>
                  <span className="text-hero-foreground/85">
                    {stats.dishCount} {stats.dishCount === 1 ? "dish" : "dishes"}
                  </span>
                  <span className="font-medium">
                    from <span className="font-heading text-base font-bold text-hero-accent">{formatRupees(stats.minPrice)}</span>
                  </span>
                </>
              )
            ) : (
              <span className="font-semibold">Closed right now · menu still browsable</span>
            )}
          </p>
        </div>
      </Link>
    </div>
  );
}
