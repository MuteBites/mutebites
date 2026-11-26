"use client";

import { BadgePercent, Gift, Sparkles } from "lucide-react";
import { IconTile } from "@/components/icon-tile";
import { ConfettiBurst } from "@/components/orders/confetti-burst";
import type { AppliedDeal, DealKey, NextDeal } from "@/lib/deals";
import { formatRupees } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The restaurant deals this cart earned — applied on their own, no tap
 * needed. Each lands with FoodHub's "offer applied" moment in MuteBites'
 * colours: the card's border rings out green twice (`.offer-glow`),
 * MuteBites confetti falls across it (`ConfettiBurst`, the palette's
 * `--confetti-*`), the gift tile stamps in with a twist (`.offer-stamp`), a
 * band of amber light runs through the saving line (`.offer-shine`) and a
 * "Free!" / "−₹50" chip floats up and away (`.offer-rise`). Keyed on the
 * deal's label, so it replays when a bigger deal (or another gift) takes
 * over. A deal with a gift to pick shows its options as chips; under it, a
 * nudge towards the next deal.
 */
export function DealsCard({
  applied,
  next,
  picks,
  onPick,
}: {
  applied: AppliedDeal[];
  next: NextDeal | null;
  picks: Partial<Record<DealKey, string[]>>;
  onPick: (key: DealKey, choice: string[]) => void;
}) {
  if (applied.length === 0 && !next) return null;
  return (
    <section aria-label="Offers" className="mt-4 space-y-2.5">
      {applied.map((deal) => {
        const celebrate = `${deal.key}|${deal.label}`;
        return (
          <div key={deal.key} className="relative rounded-[1.5rem] border border-success/40 bg-card shadow-card">
            <span key={`glow-${celebrate}`} className="offer-glow pointer-events-none absolute inset-0 rounded-[1.5rem]" aria-hidden="true" />
            <div
              key={`confetti-${celebrate}`}
              className="offer-celebration pointer-events-none absolute inset-0 overflow-hidden rounded-[1.5rem] motion-reduce:hidden"
            >
              <ConfettiBurst />
            </div>
            <div className="relative flex items-center gap-3.5 px-5 py-4" role="status">
              <IconTile key={`tile-${celebrate}`} className="offer-stamp bg-success-soft text-success">
                {deal.off > 0 ? <BadgePercent className="size-5" aria-hidden="true" /> : <Gift className="size-5" aria-hidden="true" />}
              </IconTile>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">
                  Offer <span className="text-success">applied</span>
                </span>
                <span key={`shine-${celebrate}`} className="offer-shine block text-sm font-semibold text-success">
                  {deal.label}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-success-soft px-2.5 py-0.5 text-sm font-bold text-success tabular-nums">
                {deal.off > 0 ? `−${formatRupees(deal.off)}` : "Free"}
              </span>
              <span
                key={`rise-${celebrate}`}
                className="offer-rise pointer-events-none absolute -top-3 right-14 rounded-full bg-success px-2.5 py-0.5 text-sm font-bold text-success-foreground shadow-card tabular-nums motion-reduce:hidden"
                aria-hidden="true"
              >
                {deal.off > 0 ? `−${formatRupees(deal.off)}` : "Free!"}
              </span>
            </div>
            {deal.choose && deal.choose.options.length > 0 && (
              <DealChoice deal={deal} picked={picks[deal.key] ?? []} onPick={(c) => onPick(deal.key, c)} />
            )}
          </div>
        );
      })}
      {next && (
        <p className="flex items-center gap-2 rounded-2xl border border-dashed border-primary/50 bg-card px-4 py-2.5 text-sm font-semibold">
          <Sparkles className="size-4 shrink-0 text-primary" aria-hidden="true" />
          {next.text}
        </p>
      )}
    </section>
  );
}

/** Pick the gift: one option, or `count` of them (the same one can be picked twice). */
function DealChoice({
  deal,
  picked,
  onPick,
}: {
  deal: AppliedDeal;
  picked: string[];
  onPick: (choice: string[]) => void;
}) {
  const { count, options } = deal.choose!;
  // Defaults mirror place_order(): the first option, repeated.
  const current = Array.from({ length: count }, (_, i) =>
    picked[i] && options.includes(picked[i]) ? picked[i] : (picked[0] && options.includes(picked[0]) ? picked[0] : options[0]),
  );
  return (
    <div className="relative space-y-2 border-t px-5 pt-3 pb-4">
      {current.map((value, slot) => (
        <div key={slot}>
          <p className="text-label text-muted-foreground">
            {count === 1 ? "Pick your free one" : `Free pick ${slot + 1} of ${count}`}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5" role="radiogroup" aria-label={count === 1 ? "Free item" : `Free pick ${slot + 1}`}>
            {options.map((o) => {
              const on = o === value;
              return (
                <button
                  key={o}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => onPick(current.map((c, i) => (i === slot ? o : c)))}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/80",
                    on ? "surface-ink bg-ink text-ink-foreground" : "border bg-card shadow-card hover:bg-secondary/60",
                  )}
                >
                  {o}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
