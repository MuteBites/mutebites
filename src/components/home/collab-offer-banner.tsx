import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

/**
 * Home's banner for Spice Magic's today-only ₹170 offer (the MuteBites x
 * FoodHub collab, 28 Nov 2026), in the collab's pine → gold → blood-plum
 * light. Shown only while Spice Magic is on and the offer is live
 * (getSpecialPriceOn(): its switch, and before SPECIAL_PRICE.until), so it
 * disappears by itself at midnight. Any of Spice Magic's deals that are on
 * ride along as chips. Taps through to its menu.
 */
export function CollabOfferBanner({
  restaurantId,
  restaurantName,
  title,
  deals,
}: {
  restaurantId: string;
  restaurantName: string;
  title: string;
  deals: string[];
}) {
  return (
    <div className="collab-card mt-6">
      <span className="collab-ring" aria-hidden="true" />
      <Link
        href={`/restaurants/${restaurantId}`}
        transitionTypes={["nav-forward"]}
        className="collab-wash pressable relative block overflow-hidden rounded-[calc(1.75rem-2px)] px-5 py-4 shadow-card outline-none focus-visible:ring-3 focus-visible:ring-hero-foreground/70"
      >
        <span className="collab-sweep" aria-hidden="true" />
        <span className="relative flex items-center gap-1.5 text-sm font-semibold text-hero-accent">
          <Sparkles className="size-4" aria-hidden="true" />
          Today only · {restaurantName} × FoodHub
        </span>
        <span className="relative mt-1 flex items-center justify-between gap-3">
          <span className="font-heading text-title leading-tight font-bold">{title}</span>
          <span className="glow-amber flex size-10 shrink-0 items-center justify-center rounded-full bg-hero-accent text-hero">
            <ArrowRight className="size-4.5" aria-hidden="true" />
          </span>
        </span>
        {deals.length > 0 && (
          <span className="relative mt-2.5 flex flex-wrap gap-1.5">
            {deals.map((d) => (
              <span key={d} className="rounded-full bg-hero-foreground/15 px-2.5 py-1 text-xs font-semibold">
                {d}
              </span>
            ))}
          </span>
        )}
      </Link>
    </div>
  );
}
