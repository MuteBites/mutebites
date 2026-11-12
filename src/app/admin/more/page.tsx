import type { Metadata } from "next";
import Link from "next/link";
import { BadgePercent, BookOpen, ChevronRight, History, PackageX, Star, Users, type LucideIcon } from "lucide-react";
import { IconTile } from "@/components/icon-tile";
import { RestaurantToggleList } from "@/components/admin/restaurant-toggle-list";
import { getAdminRestaurants } from "@/lib/data/admin";
import { getOffers } from "@/lib/data/offers";
import { getOrderingState } from "@/lib/data/settings";

export const metadata: Metadata = { title: "More · MuteBites Admin" };

const LINKS: { href: string; label: string; note: string; Icon: LucideIcon }[] = [
  { href: "/admin/history", label: "Order history", note: "Every order, by day", Icon: History },
  { href: "/admin/users", label: "Users", note: "Students, rewards and bans", Icon: Users },
  { href: "/admin/reviews", label: "Reviews", note: "Ratings and notes", Icon: Star },
  { href: "/admin/menus", label: "Menus", note: "Restaurants, sections, dishes", Icon: BookOpen },
  { href: "/admin/sold-out", label: "Sold out", note: "Take dishes off sale", Icon: PackageX },
  { href: "/admin/offers", label: "Offers", note: "5% / 10% / 20% and the biryani offer", Icon: BadgePercent },
];

/**
 * The admin's "More" tab (mobile-first redesign, 12 Nov 2026): every admin
 * page as one list, then the restaurant switches — moved off the
 * dashboard so it can be all about the orders.
 */
export default async function AdminMorePage() {
  const [restaurants, ordering, offers] = await Promise.all([getAdminRestaurants(), getOrderingState(), getOffers()]);

  return (
    <>
      <h1 className="font-heading text-headline font-bold">More</h1>

      <nav aria-label="Admin pages" className="overflow-hidden rounded-3xl border bg-card shadow-card">
        <ul className="divide-y">
          {LINKS.map(({ href, label, note, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-3 px-4 py-3.5 outline-none hover:bg-secondary/60 focus-visible:bg-secondary/60"
              >
                <IconTile>
                  <Icon className="size-5" aria-hidden="true" />
                </IconTile>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{label}</span>
                  <span className="block truncate text-sm text-muted-foreground">{note}</span>
                </span>
                {href === "/admin/offers" && offers.active.length > 0 && (
                  <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-bold text-success">
                    {offers.active.length} on
                  </span>
                )}
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section>
        <h2 className="mb-3 font-heading text-title font-bold">Restaurants</h2>
        <RestaurantToggleList
          restaurants={restaurants}
          orderingEnabled={ordering.open}
          forcedClosed={ordering.mode === "closed"}
          closedChip={ordering.short}
        />
      </section>
    </>
  );
}
