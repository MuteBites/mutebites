import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/** "N pickups, N no-shows" — rewards the reliability the ban system exists to enforce. */
export function PickupStats({ pickups, noShows }: { pickups: number; noShows: number }) {
  return (
    <div className="mt-3 flex items-center gap-3 rounded-2xl border bg-card shadow-card px-5 py-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
        <ShieldCheck className="size-5" aria-hidden="true" />
      </span>
      <p>
        <span className="font-heading text-lg font-bold tabular-nums">{pickups}</span>{" "}
        {pickups === 1 ? "pickup" : "pickups"},{" "}
        <span className={cn("font-heading text-lg font-bold tabular-nums", noShows > 0 && "text-destructive")}>
          {noShows}
        </span>{" "}
        {noShows === 1 ? "no-show" : "no-shows"}
      </p>
    </div>
  );
}
