import { Skeleton } from "@/components/ui/skeleton";

// Mirrors orders/[id]/page.tsx's layout so nothing jumps once the real
// order loads — also what shows during a manual refresh of this page.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-md px-6 pb-12" aria-busy="true">
      <span className="sr-only">Loading order…</span>

      <div className="flex items-center gap-3 pt-4 pb-2">
        <Skeleton className="size-11 rounded-full" />
      </div>

      <div className="rounded-3xl bg-ink p-6">
        <Skeleton className="h-4 w-40 bg-white/10" />
        <div className="mt-4 flex items-start justify-between gap-2">
          <Skeleton className="h-4 w-24 bg-white/10" />
          <Skeleton className="h-4 w-28 bg-white/10" />
        </div>
        <Skeleton className="mt-1 h-10 w-32 bg-white/10" />
        <Skeleton className="mt-4 h-9 w-56 rounded-xl bg-white/10" />
      </div>

      <div className="mt-6 flex flex-col">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-4 pb-6">
            <Skeleton className="size-7 shrink-0 rounded-full" />
            <Skeleton className="mt-0.5 h-4 w-40" />
          </div>
        ))}
      </div>

      <div className="mt-2 rounded-2xl border bg-card shadow-card p-5">
        <Skeleton className="h-3 w-24" />
        <div className="mt-3 flex flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl border bg-card shadow-card px-5 py-4">
        <div>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-1.5 h-4 w-28" />
        </div>
        <Skeleton className="h-11 w-24 rounded-xl" />
      </div>
    </main>
  );
}
