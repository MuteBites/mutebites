import type { ReactNode } from "react";
import { Compass, Repeat, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

const REGULAR_THRESHOLD = 10;

export function MilestoneBadges({
  deliveredCount,
  restaurantsVisited,
  totalRestaurants,
}: {
  /** Orders that actually reached the student (status = delivered). */
  deliveredCount: number;
  /** Distinct restaurants among those delivered orders. */
  restaurantsVisited: number;
  /** Restaurants on the platform right now — Campus Explorer needs all of them. */
  totalRestaurants: number;
}) {
  return (
    <section className="mt-6">
      <p className="font-mono text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        Milestones
      </p>
      <div className="mt-2 grid grid-cols-3 gap-3">
        <BadgeTile
          icon={<UtensilsCrossed className="size-5" aria-hidden="true" />}
          label="First Bite"
          hint="Place your first order"
          unlocked={deliveredCount >= 1}
        />
        <BadgeTile
          icon={<Repeat className="size-5" aria-hidden="true" />}
          label="Regular"
          hint={`${REGULAR_THRESHOLD} orders delivered`}
          unlocked={deliveredCount >= REGULAR_THRESHOLD}
        />
        <BadgeTile
          icon={<Compass className="size-5" aria-hidden="true" />}
          label="Campus Explorer"
          hint="Order from every restaurant"
          unlocked={totalRestaurants > 0 && restaurantsVisited >= totalRestaurants}
        />
      </div>
    </section>
  );
}

function BadgeTile({
  icon,
  label,
  hint,
  unlocked,
}: {
  icon: ReactNode;
  label: string;
  hint: string;
  unlocked: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl border px-2 py-3 text-center",
        unlocked ? "border-primary/20 bg-brand-soft" : "border-dashed bg-secondary/40",
      )}
      title={unlocked ? label : `${label} · ${hint}`}
    >
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-full",
          unlocked ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <span
        className={cn(
          "text-xs leading-tight font-semibold",
          unlocked ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </div>
  );
}
