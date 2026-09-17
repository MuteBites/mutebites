import { Flame } from "lucide-react";

/**
 * "N cravings solved" — reframes the old "orders placed" count around
 * delivered orders specifically (a cancelled order didn't solve anything).
 * `streakDays` (consecutive IST days with a delivered order) shows as a
 * small chip when it's at least 1. Progress toward the "Regular" milestone
 * now lives on that milestone's own tile (a ring around its icon), not
 * duplicated here.
 */
export function CravingsSolved({ count, streakDays }: { count: number; streakDays: number }) {
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1.5">
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
  );
}
