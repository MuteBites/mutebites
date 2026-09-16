import { Trophy } from "lucide-react";
import type { WeeklyRank } from "@/lib/data/rank";

const MIN_PARTICIPANTS = 5;

/**
 * "Top N% of orderers this week" — only shown when it's flattering
 * (top half or better) and the participating pool is big enough that
 * the percentile actually means something.
 */
export function WeeklyRankBadge({ rank }: { rank: WeeklyRank | null }) {
  if (!rank || rank.percentile > 50 || rank.totalStudents < MIN_PARTICIPANTS) return null;

  return (
    <div className="mt-3 flex items-center gap-3 rounded-2xl border border-primary/20 bg-brand-soft px-5 py-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Trophy className="size-5" aria-hidden="true" />
      </span>
      <p className="text-brand-soft-foreground">
        <span className="font-heading text-lg font-bold text-foreground">Top {rank.percentile}%</span> of
        orderers this week
      </p>
    </div>
  );
}
