import Link from "next/link";
import type { Restaurant } from "@/lib/data/types";
import { cn } from "@/lib/utils";

export function RestaurantCard({
  restaurant,
  orderingEnabled,
}: {
  restaurant: Restaurant;
  orderingEnabled: boolean;
}) {
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
      className="group block overflow-hidden rounded-3xl border bg-card outline-none transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/40"
    >
      <div className={cn("relative aspect-[5/2] bg-stripes", !active && "opacity-60 grayscale")}>
        <span
          className={cn(
            "absolute right-4 bottom-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold",
            open ? "bg-success-soft text-success" : "bg-secondary text-muted-foreground",
          )}
        >
          <span
            className={cn("size-1.5 rounded-full", open ? "bg-success" : "bg-muted-foreground")}
            aria-hidden="true"
          />
          {!active ? "CLOSED" : paused ? "PAUSED" : "OPEN"}
        </span>
      </div>

      <div className={cn("px-5 pt-4 pb-5", !open && "text-muted-foreground")}>
        <h2 className="font-heading text-2xl font-bold tracking-tight">{restaurant.name}</h2>
        {restaurant.description && (
          <p className="mt-1 text-muted-foreground">{restaurant.description}</p>
        )}

        {open ? (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Cuisines">
            <li className="rounded-full bg-success-soft px-3 py-1 text-sm font-medium text-success">
              Free delivery
            </li>
            {restaurant.cuisine_tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-xl bg-secondary px-4 py-2.5 text-sm">
            {!active ? "Closed right now · menu still browsable" : "Browse menu · ordering paused"}
          </p>
        )}
      </div>
    </Link>
  );
}
