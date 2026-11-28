import { Gift } from "lucide-react";
import { DEALS, type DealKey } from "@/lib/deals";

/**
 * A restaurant's own deals on its menu page while the admin has them on
 * (FoodHub's banner, 26 Nov 2026): each step on its own line, a band of
 * light sweeping across now and then. The cart applies them by itself once
 * the order qualifies, so there's nothing to tap here.
 */
export function DealBanner({
  restaurantName,
  on,
  compact = false,
  extra = [],
}: {
  restaurantName: string;
  on: DealKey[];
  /** A slim strip of offer chips (Spice Magic, 28 Nov 2026) instead of the box. */
  compact?: boolean;
  /** Offers that aren't deals, listed first (Spice Magic's ₹170 biryanis). */
  extra?: string[];
}) {
  const deals = DEALS.filter((d) => d.restaurant === restaurantName && on.includes(d.key)).sort(
    (a, b) => a.group.localeCompare(b.group) || a.min - b.min,
  );
  const lines = [...extra, ...deals.map((d) => d.title)];
  if (lines.length === 0) return null;
  if (compact) {
    return (
      <section
        aria-label="Offers here"
        className="animate-shine relative mt-3 flex items-center gap-2 overflow-hidden rounded-full border border-success/40 bg-success-soft py-1.5 pr-1.5 pl-3"
      >
        <Gift className="size-4 shrink-0 text-success" aria-hidden="true" />
        <ul className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto text-xs font-semibold [scrollbar-width:none]">
          {lines.map((line) => (
            <li key={line} className="shrink-0 rounded-full bg-card px-2.5 py-1 whitespace-nowrap">
              {line}
            </li>
          ))}
        </ul>
      </section>
    );
  }
  return (
    <section
      aria-label="Offers here"
      className="animate-shine relative mt-4 overflow-hidden rounded-[1.5rem] border border-success/40 bg-success-soft px-5 py-4"
    >
      <p className="flex items-center gap-2 font-heading text-lg font-bold text-success">
        <Gift className="size-5 shrink-0" aria-hidden="true" />
        Offers at {restaurantName}
      </p>
      <ul className="mt-1.5 space-y-1 text-sm font-medium">
        {deals.map((d) => (
          <li key={d.key} className="flex gap-2">
            <span className="text-success" aria-hidden="true">
              •
            </span>
            {d.title}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">Applied by itself in your cart once you qualify.</p>
    </section>
  );
}
