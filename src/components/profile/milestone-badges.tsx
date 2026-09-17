import type { ReactNode } from "react";
import { Compass, Repeat, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

const REGULAR_THRESHOLD = 10;

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

const TOTAL_MILESTONES = 3;

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
      <p className="flex items-baseline gap-1.5 font-mono text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        Milestones <span className="normal-case">({unlocked.size}/{TOTAL_MILESTONES} achieved)</span>
      </p>
      <div className="mt-2 grid grid-cols-3 gap-3">
        <BadgeTile
          icon={<UtensilsCrossed className="size-5" aria-hidden="true" />}
          label="First Bite"
          hint="Place your first order"
          unlocked={unlocked.has("first_bite")}
          progress={Math.min(1, deliveredCount / 1)}
        />
        <BadgeTile
          icon={<Repeat className="size-5" aria-hidden="true" />}
          label="Regular"
          hint={`${REGULAR_THRESHOLD} orders delivered`}
          unlocked={unlocked.has("regular")}
          progress={Math.min(1, deliveredCount / REGULAR_THRESHOLD)}
        />
        <BadgeTile
          icon={<Compass className="size-5" aria-hidden="true" />}
          label="Campus Explorer"
          hint="Order from every restaurant"
          unlocked={unlocked.has("campus_explorer")}
          progress={totalRestaurants > 0 ? Math.min(1, restaurantsVisited / totalRestaurants) : 0}
        />
      </div>
    </section>
  );
}

// Ring geometry for the size-11 (44px) icon circle.
const RING_SIZE = 44;
const RING_STROKE = 3;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

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
  /** 0–1 fraction toward this milestone, drawn as a ring around the icon. */
  progress: number;
}) {
  const dashOffset = RING_CIRCUMFERENCE * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl border px-2 py-3 text-center",
        unlocked ? "border-primary/20 bg-brand-soft" : "border-dashed bg-secondary/40",
      )}
      title={unlocked ? label : `${label} · ${hint}`}
    >
      <span className="relative flex size-11 shrink-0 items-center justify-center">
        <svg viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} className="absolute inset-0 -rotate-90">
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            strokeWidth={RING_STROKE}
            className="stroke-secondary"
          />
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="stroke-primary transition-[stroke-dashoffset]"
          />
        </svg>
        <span
          className={cn(
            "relative flex size-8 items-center justify-center rounded-full",
            unlocked ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
          )}
        >
          {icon}
        </span>
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
