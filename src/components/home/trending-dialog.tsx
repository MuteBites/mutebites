"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { TrendingDish } from "@/lib/data/trending";

/** Tapping the Home header's flame button pops up the top ordered dishes this week — same pattern as AboutMuteBitesDialog on the logo. */
export function TrendingDialog({ dishes }: { dishes: TrendingDish[] }) {
  return (
    <Dialog>
      <DialogTrigger
        aria-label="Trending this week"
        className="pressable flex size-14 shrink-0 items-center justify-center rounded-2xl bg-secondary outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        <Flame className="size-6 text-primary" aria-hidden="true" />
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="flex items-center gap-1.5">
          <span aria-hidden="true">🔥</span> Trending this week
        </DialogTitle>
        {dishes.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No orders yet this week — be the first to start a trend.
          </p>
        ) : (
          <ol className="mt-4 flex flex-col gap-2.5">
            {dishes.map((d, i) => (
              <li key={d.dishId}>
                <Link
                  href={`/restaurants/${d.restaurantId}`}
                  transitionTypes={["nav-forward"]}
                  className="pressable flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate font-semibold">{d.dishName}</span>
                    <span className="block truncate text-xs text-muted-foreground">{d.restaurantName}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}
