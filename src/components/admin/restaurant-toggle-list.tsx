"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AdminRestaurant } from "@/lib/data/admin";
import { setRestaurantActive } from "@/lib/admin/actions";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

function RestaurantToggleCard({
  restaurant,
  orderingEnabled,
}: {
  restaurant: AdminRestaurant;
  /** Campus-wide kill switch — a restaurant can be individually "open" and still not actually take orders while this is off. */
  orderingEnabled: boolean;
}) {
  const [active, setActive] = useState(restaurant.is_active);
  const [pending, startTransition] = useTransition();
  // This restaurant itself is open, but campus-wide ordering is off — its
  // own toggle didn't do this, so it gets a distinct label rather than
  // being shown as plain "Open" (which would read as taking orders right
  // now) or "Closed" (which would misattribute the pause to this restaurant).
  const paused = active && !orderingEnabled;

  function toggle() {
    const next = !active;
    startTransition(async () => {
      const result = await setRestaurantActive(restaurant.id, next);
      if (result.ok) {
        setActive(next);
        toast.success(`${restaurant.name} is now ${next ? "open" : "closed"}.`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4">
      <div className="min-w-0">
        <p className="truncate font-semibold">{restaurant.name}</p>
        <div className="mt-1 flex items-center gap-1.5">
          <span
            className={cn(
              "size-1.5 rounded-full",
              !active ? "bg-destructive" : paused ? "bg-primary" : "bg-success",
            )}
            aria-hidden="true"
          />
          <Badge
            variant={!active ? "destructive" : paused ? "default" : "outline"}
            className={cn(
              "uppercase",
              active && !paused && "border-transparent bg-success-soft text-success",
            )}
          >
            Status: {!active ? "Closed" : paused ? "Paused" : "Open"}
          </Badge>
        </div>
        {paused && (
          <p className="mt-1 text-xs text-muted-foreground">Campus ordering is paused — see above.</p>
        )}
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={toggle}
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold uppercase outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-70",
          active
            ? "bg-destructive text-white hover:bg-destructive/90"
            : "bg-success text-white hover:bg-success/90",
        )}
      >
        {pending && <Loader2 className="size-3.5 animate-spin" />}
        {active ? "Turn off" : "Turn on"}
      </button>
    </div>
  );
}

export function RestaurantToggleList({
  restaurants,
  orderingEnabled,
}: {
  restaurants: AdminRestaurant[];
  orderingEnabled: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {restaurants.map((restaurant) => (
        <RestaurantToggleCard
          key={restaurant.id}
          restaurant={restaurant}
          orderingEnabled={orderingEnabled}
        />
      ))}
    </div>
  );
}
