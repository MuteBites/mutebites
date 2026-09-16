import { ViewTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { REVEAL_EXIT } from "@/lib/nav-transition";

// Mirrors restaurants/[id]/page.tsx's layout (hero, header, category
// chips, dish rows) so nothing jumps once the real menu replaces it.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-md" aria-busy="true">
      <span className="sr-only">Loading menu…</span>

      <ViewTransition {...REVEAL_EXIT}>
        <Skeleton className="aspect-[2/1] w-full rounded-none" />

        <div className="px-6">
          <div className="pt-5 pb-3">
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="mt-1 h-7 w-20 shrink-0 rounded-full" />
            </div>
            <Skeleton className="mt-2 h-4 w-56" />
            <Skeleton className="mt-4 h-4 w-48" />
            <Skeleton className="mt-1.5 h-1.5 w-full rounded-full" />
          </div>

          <div className="flex gap-2 border-b py-3">
            <Skeleton className="h-10 w-16 rounded-full" />
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-20 rounded-full" />
          </div>

          <div className="mt-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-4 border-b py-5 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="mt-2 h-4 w-16" />
                </div>
                <Skeleton className="h-11 w-24 shrink-0 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </ViewTransition>
    </main>
  );
}
