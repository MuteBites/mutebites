import { ViewTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { REVEAL_EXIT } from "@/lib/nav-transition";

// Mirrors page.tsx's layout (header, search, promo strip, restaurant
// cards) so nothing jumps once the real data replaces it.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-md px-6 pt-6 pb-28" aria-busy="true">
      <span className="sr-only">Loading restaurants…</span>

      <ViewTransition {...REVEAL_EXIT}>
        <div className="flex items-center gap-3">
          <Skeleton className="size-14 rounded-2xl" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-2 h-6 w-44" />
          </div>
          <Skeleton className="size-14 shrink-0 rounded-full" />
        </div>

        <Skeleton className="mt-6 h-14 w-full rounded-2xl" />
        <Skeleton className="mt-4 h-14 w-full rounded-2xl" />

        <div className="mt-8 flex items-baseline justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>

        <div className="mt-4 flex flex-col gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="overflow-hidden rounded-3xl border bg-card">
              <Skeleton className="aspect-[5/2] w-full rounded-none" />
              <div className="px-5 pt-4 pb-5">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="mt-2 h-4 w-1/2" />
                <div className="mt-3 flex gap-2">
                  <Skeleton className="h-7 w-24 rounded-full" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </ViewTransition>
    </main>
  );
}
