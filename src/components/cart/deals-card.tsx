"use client";

import { Gift, PartyPopper, Sparkles } from "lucide-react";
import type { AppliedDeal, DealKey, NextDeal } from "@/lib/deals";
import { formatRupees } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The restaurant deals this cart earned — applied on their own, no tap
 * needed. Each one lands with the "Offer applied!" pop (`.deal-pop`: the
 * card springs in, a light sweeps across, sparkles burst and the gift
 * wiggles), keyed on the deal so it replays when a bigger one takes over.
 * A deal with a gift to pick shows its options as chips. Under it, a nudge
 * towards the next deal.
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
      {applied.map((deal) => (
        <div
          key={deal.key}
          role="status"
          className="deal-pop surface-hero glow-hero relative overflow-hidden rounded-[1.5rem] bg-hero px-4 py-3.5 text-hero-foreground"
        >
          <span aria-hidden="true" className="deal-shine pointer-events-none absolute inset-0" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              aria-hidden="true"
              className="deal-spark pointer-events-none absolute top-1/2 left-7 size-1.5 rounded-full"
              style={{ "--i": i } as React.CSSProperties}
            />
          ))}
          <div className="relative flex items-center gap-3">
            <span className="deal-gift flex size-10 shrink-0 items-center justify-center rounded-2xl bg-hero-foreground/15">
              {deal.off > 0 ? (
                <PartyPopper className="size-5 text-hero-accent" aria-hidden="true" />
              ) : (
                <Gift className="size-5 text-hero-accent" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="deal-tag text-sm font-bold text-hero-accent">Offer applied!</p>
              <p className="font-semibold leading-snug">{deal.label}</p>
            </div>
            {deal.off > 0 && (
              <span className="shrink-0 rounded-full bg-hero-foreground/15 px-2.5 py-1 text-sm font-bold text-hero-success tabular-nums">
                −{formatRupees(deal.off)}
              </span>
            )}
          </div>
          {deal.choose && deal.choose.options.length > 0 && (
            <DealChoice
              deal={deal}
              picked={picks[deal.key] ?? []}
              onPick={(c) => onPick(deal.key, c)}
            />
          )}
        </div>
      ))}
      {next && (
        <p className="flex items-center gap-2 rounded-2xl bg-brand-soft px-4 py-2.5 text-sm font-semibold text-brand-soft-foreground">
          <Sparkles className="size-4 shrink-0" aria-hidden="true" />
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
    <div className="relative mt-3 space-y-2 border-t border-hero-foreground/15 pt-3">
      {current.map((value, slot) => (
        <div key={slot}>
          <p className="text-xs font-semibold text-hero-foreground/85">
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
                    "rounded-full px-3 py-1.5 text-xs font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-hero-foreground/60",
                    on ? "bg-hero-foreground text-hero" : "bg-hero-foreground/12 text-hero-foreground hover:bg-hero-foreground/20",
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
