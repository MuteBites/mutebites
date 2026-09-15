import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MenuView } from "@/components/menu/menu-view";
import { getRestaurantMenu } from "@/lib/data/restaurants";
import { requireProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: PageProps<"/restaurants/[id]">): Promise<Metadata> {
  const { id } = await params;
  const menu = await getRestaurantMenu(id);
  return { title: menu ? `${menu.restaurant.name} · MuteBites` : "MuteBites" };
}

export default async function RestaurantPage({ params }: PageProps<"/restaurants/[id]">) {
  const profile = await requireProfile();
  const { id } = await params;
  const menu = await getRestaurantMenu(id);
  if (!menu) notFound();

  const { restaurant, sections } = menu;
  const open = restaurant.is_active;

  return (
    <main className="mx-auto w-full max-w-md">
      <div className={cn("relative aspect-[2/1] bg-stripes", !open && "grayscale")}>
        <Link
          href="/"
          aria-label="Back to restaurants"
          className="absolute top-4 left-4 flex size-12 items-center justify-center rounded-full bg-card shadow-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <ArrowLeft className="size-5" />
        </Link>
      </div>

      <div className="px-6">
        <header className="pt-5 pb-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-heading text-3xl leading-tight font-bold tracking-tight">
              {restaurant.name}
            </h1>
            <span
              className={cn(
                "mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold",
                open ? "bg-success-soft text-success" : "bg-secondary text-muted-foreground",
              )}
            >
              <span
                className={cn("size-1.5 rounded-full", open ? "bg-success" : "bg-muted-foreground")}
                aria-hidden="true"
              />
              {open ? "OPEN" : "CLOSED"}
            </span>
          </div>
          <p className="mt-1.5 text-muted-foreground">
            {[restaurant.description, "Free delivery"].filter(Boolean).join(" · ")}
          </p>
          {!open && (
            <p className="mt-4 rounded-2xl bg-secondary px-4 py-3 text-sm">
              <strong className="font-semibold">Closed right now.</strong> You can browse the
              menu — ordering opens when they&apos;re back.
            </p>
          )}
        </header>

        <MenuView restaurant={restaurant} sections={sections} profilePhone={profile.phone} />
      </div>
    </main>
  );
}
