import Link from "next/link";
import type { ThursdaySpecial } from "@/lib/data/restaurants";

/** Thursday-only banner nudging toward the day's special dish. */
export function ThursdayNudge({ special }: { special: ThursdaySpecial }) {
  return (
    <Link
      href={`/restaurants/${special.restaurantId}`}
      transitionTypes={["nav-forward"]}
      className="pressable mt-4 flex items-center gap-3 rounded-2xl border border-primary/20 bg-brand-soft px-5 py-3.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
    >
      <span aria-hidden="true" className="text-xl">
        🔥
      </span>
      <span className="text-brand-soft-foreground">
        <span className="font-semibold">{special.dishName}</span> is on today at {special.restaurantName}
      </span>
    </Link>
  );
}
