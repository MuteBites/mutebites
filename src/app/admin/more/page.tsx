import type { Metadata } from "next";
import Link from "next/link";
import { Ban, BookOpen, Hash, History, PackageX, Star, Tag, Users, type LucideIcon } from "lucide-react";
import { InstallAdminButton } from "@/components/admin/install-admin-button";
import { ThemeTile } from "@/components/admin/theme-tile";
import { getOffers } from "@/lib/data/offers";

export const metadata: Metadata = { title: "More · MuteBites Admin" };

const TILES: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/admin/history", label: "History", Icon: History },
  { href: "/admin/users", label: "Users", Icon: Users },
  { href: "/admin/reviews", label: "Reviews", Icon: Star },
  { href: "/admin/menus", label: "Restaurants & menus", Icon: BookOpen },
  { href: "/admin/sold-out", label: "Sold out", Icon: PackageX },
  { href: "/admin/offers", label: "Offers", Icon: Tag },
  { href: "/admin/banned", label: "Banned", Icon: Ban },
  { href: "/admin/tokens", label: "Block order number", Icon: Hash },
];

/** One square tile: an icon on a blush square over its name — the mock-up's look. */
const TILE =
  "relative flex aspect-square flex-col items-center justify-center gap-2.5 rounded-3xl border bg-card p-2 text-center text-sm font-semibold shadow-card outline-none transition-colors hover:bg-secondary/60 focus-visible:ring-3 focus-visible:ring-ring/80";

/**
 * The admin's "More" tab (mobile-first redesign, 12 Nov 2026), as in the
 * approved mock-up: always a full 3 × 3 grid — eight admin pages, then
 * Block order number (tokens to skip today), then Appearance (the admin's
 * own Light / Dark / System, a tap steps through them, kept apart from the
 * student app's). Install MuteBites Admin is a banner above, hidden inside the
 * installed app, so the grid never has a gap. (The restaurant switches live on the Kitchen tab.)
 */
export default async function AdminMorePage() {
  const offers = await getOffers();

  return (
    <>
      <h1 className="font-heading text-headline font-bold">More</h1>

      <InstallAdminButton
        variant="banner"
        className="flex w-full items-center gap-3 rounded-3xl border bg-card px-4 py-3 shadow-card outline-none transition-colors hover:bg-secondary/60 focus-visible:ring-3 focus-visible:ring-ring/80"
      />

      <nav aria-label="Admin pages">
        <ul className="grid grid-cols-3 gap-3">
          {TILES.map(({ href, label, Icon }) => (
            <li key={href}>
              <Link href={href} className={TILE}>
                <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-soft-foreground">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                {label}
                {href === "/admin/offers" && offers.active.length + offers.deals.on.length > 0 && (
                  <span className="absolute top-2 right-2 rounded-full bg-success-soft px-1.5 py-0.5 text-[10px] font-bold text-success">
                    {offers.active.length + offers.deals.on.length} on
                  </span>
                )}
              </Link>
            </li>
          ))}
          <li>
            <ThemeTile className={`${TILE} w-full`} />
          </li>
        </ul>
      </nav>

    </>
  );
}
