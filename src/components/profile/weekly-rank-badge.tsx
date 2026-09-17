import { Flame, Sparkle, Trophy, type LucideIcon } from "lucide-react";
import type { WeeklyRank } from "@/lib/data/rank";

const MIN_PARTICIPANTS = 5;

// Tiers instead of a raw percentile — "Top 40%" reads as ambiguous
// stats-speak (students kept asking what it meant); a label needs no
// interpreting. Checked in order, first match wins.
const TIERS: { maxPercentile: number; label: string; Icon: LucideIcon }[] = [
  { maxPercentile: 10, label: "Top orderer this week", Icon: Trophy },
  { maxPercentile: 25, label: "Frequent orderer this week", Icon: Flame },
  { maxPercentile: 50, label: "Active orderer this week", Icon: Sparkle },
];

/**
 * Tiered version of the weekly rank — only shown when it's flattering
 * (top half or better) and the participating pool is big enough that the
 * underlying percentile actually means something.
 */
export function WeeklyRankBadge({ rank }: { rank: WeeklyRank | null }) {
  if (!rank || rank.totalStudents < MIN_PARTICIPANTS) return null;

  const tier = TIERS.find((t) => rank.percentile <= t.maxPercentile);
  if (!tier) return null;

  return (
    <div className="mt-3 flex items-center gap-3 rounded-2xl border border-primary/20 bg-brand-soft px-5 py-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <tier.Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="font-heading text-lg font-bold text-foreground">{tier.label}</p>
    </div>
  );
}
