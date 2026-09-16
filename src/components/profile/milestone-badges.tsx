import type { ReactNode } from "react";
import { Compass, Repeat, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

export const REGULAR_THRESHOLD = 10;

export type MilestoneKey = "first_bite" | "regular" | "campus_explorer";

/** Shared unlock logic — used both to render the badges and (in profile/page.tsx) to detect a newly-unlocked one for the toast. */
export function getUnlockedMilestones(
  deliveredCount: number,
  restaurantsVisited: number,
  totalRestaurants: number,
): MilestoneKey[] {
  const unlocked: MilestoneKey[] = [];
  if (deliveredCount >= 1) unlocked.push("first_bite");
  if (deliveredCount >= REGULAR_THRESHOLD) unlocked.push("regular");
  if (totalRestaurants > 0 && restaurantsVisited >= totalRestaurants) unlocked.push("campus_explorer");
  return unlocked;
}

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
  const unlocked = new Set(getUnlockedMilestones(deliveredCount, restaurantsVisited, totalRestaurants));

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
          unlocked={unlocked.has("first_bite")}
        />
        <BadgeTile
          icon={<Repeat className="size-5" aria-hidden="true" />}
          label="Regular"
          hint={`${REGULAR_THRESHOLD} orders delivered`}
          unlocked={unlocked.has("regular")}
        />
        <BadgeTile
          icon={<Compass className="size-5" aria-hidden="true" />}
          label="Campus Explorer"
          hint="Order from every restaurant"
          unlocked={unlocked.has("campus_explorer")}
          progress={{ current: restaurantsVisited, total: totalRestaurants }}
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
  progress,
}: {
  icon: ReactNode;
  label: string;
  hint: string;
  unlocked: boolean;
  /** Optional X/total progress bar, shown only while locked. */
  progress?: { current: number; total: number };
}) {
  const showProgress = !unlocked && progress && progress.total > 0;

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
      {showProgress && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${Math.min(100, (progress.current / progress.total) * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
