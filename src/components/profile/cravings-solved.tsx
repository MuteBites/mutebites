import { Flame } from "lucide-react";
import { REGULAR_THRESHOLD } from "./milestone-badges";

/**
 * "N cravings solved" — reframes the old "orders placed" count around
 * delivered orders specifically (a cancelled order didn't solve anything),
 * with a thin progress bar toward the "Regular" milestone for a bit of
 * momentum before that badge unlocks below. `streakDays` (consecutive IST
 * days with a delivered order) shows as a small chip when it's at least 1.
 */
export function CravingsSolved({ count, streakDays }: { count: number; streakDays: number }) {
  const atThreshold = count >= REGULAR_THRESHOLD;
  const progress = atThreshold ? 1 : count / REGULAR_THRESHOLD;

  return (
    <div className="mt-1.5">
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5">
        <Flame className="size-4 text-primary" aria-hidden="true" />
        <p className="text-muted-foreground">
          <span className="font-heading font-bold text-foreground tabular-nums">{count}</span>{" "}
          {count === 1 ? "craving solved" : "cravings solved"}
        </p>
        {streakDays > 0 && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
            🔥 {streakDays}-day streak
          </span>
        )}
      </div>
      {!atThreshold && (
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {REGULAR_THRESHOLD - count} to Regular
          </span>
        </div>
      )}
    </div>
  );
}
