import { ViewTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { REVEAL_EXIT } from "@/lib/nav-transition";

// Mirrors orders/page.tsx's layout so nothing jumps once the real order
// history replaces it.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-md px-6 pt-6 pb-28" aria-busy="true">
      <span className="sr-only">Loading your orders…</span>

      <ViewTransition {...REVEAL_EXIT}>
        <Skeleton className="h-9 w-40" />
        <Skeleton className="mt-2 h-4 w-56" />

        <div className="mt-6 flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-3xl border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="mt-2 h-4 w-48" />
              <div className="mt-3 flex items-center justify-between">
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          ))}
        </div>
      </ViewTransition>
    </main>
  );
}
