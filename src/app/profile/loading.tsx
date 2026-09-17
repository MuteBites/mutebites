import { ViewTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { REVEAL_EXIT } from "@/lib/nav-transition";

// Mirrors profile/page.tsx's layout so nothing jumps once the real
// profile data replaces it.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-md px-6 pt-6 pb-28" aria-busy="true">
      <span className="sr-only">Loading your profile…</span>

      <ViewTransition {...REVEAL_EXIT}>
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="mt-2 h-4 w-40" />
          </div>
        </div>

        <div className="mt-6">
          <Skeleton className="h-4 w-40" />
          <div className="mt-2 grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2 rounded-2xl border px-2 py-3">
                <Skeleton className="size-11 rounded-full" />
                <Skeleton className="h-3 w-14" />
              </div>
            ))}
          </div>
        </div>

        <Skeleton className="mt-6 h-4 w-32" />
        <div className="mt-2 divide-y rounded-2xl border bg-card">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="px-5 py-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-2 h-5 w-40" />
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-14 rounded-full" />
        </div>

        <Skeleton className="mt-6 h-16 w-full rounded-2xl" />
        <Skeleton className="mt-6 h-16 w-full rounded-2xl" />

        <div className="mt-6 flex justify-center border-t pt-4">
          <Skeleton className="size-11 rounded-full" />
        </div>
      </ViewTransition>
    </main>
  );
}
