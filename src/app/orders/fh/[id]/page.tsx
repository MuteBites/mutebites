import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { ArrowLeft, MapPin, MessageCircle, Phone } from "lucide-react";
import { BlurImage } from "@/components/blur-image";
import { getDishPhoto, getRestaurantCoverPhoto } from "@/lib/data/dish-photos";
import { getPartnerOrder } from "@/lib/data/partner-orders";
import { getUploadedPhotos } from "@/lib/data/uploaded-photos";
import { formatTime } from "@/lib/date";
import { formatRupees } from "@/lib/format";
import { NAV_TRANSITION } from "@/lib/nav-transition";
import { FOODHUB, partnerDeliveredAt, partnerOf, partnerWhatsAppUrl } from "@/lib/partners";
import { formatStoredMobile } from "@/lib/phone";
import { requireProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Your order · MuteBites", robots: { index: false, follow: false } };

const timeFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" });

/**
 * A FoodHub restaurant's order (Spice Magic, the collab), laid out like
 * FoodHub's own order page and always in its dark theme: the arched window
 * with Handi and a hanging sign, the promised time, the luggage-tag card,
 * "What's in the bag" on a scalloped bill and "Contact FoodHub". No status
 * is kept — it reads delivered from 8:30 PM (partnerDeliveredAt()).
 */
export default async function PartnerOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const [order] = await Promise.all([getPartnerOrder(id), getUploadedPhotos()]);
  if (!order) notFound();

  const partner = partnerOf(order.restaurantName) ?? FOODHUB;
  const due = partnerDeliveredAt(order.createdAt);
  // eslint-disable-next-line react-hooks/purity -- server render, once per request
  const delivered = Date.now() >= due.getTime();
  const cover = getRestaurantCoverPhoto(order.restaurantName);
  const phone = `+${partner.whatsapp}`;
  const waText = `Hi ${partner.brand}, about my ${order.restaurantName} order from ${formatTime(order.createdAt)}.`;

  return (
    <main className="foodhub dark mx-auto min-h-dvh w-full max-w-md px-6 pb-12">
      <ViewTransition {...NAV_TRANSITION}>
        <div className="flex items-center gap-3 pt-3 pb-1">
          <Link
            href="/orders"
            aria-label="Back to your orders"
            transitionTypes={["nav-back"]}
            className="flex size-11 items-center justify-center rounded-full border bg-card shadow-card outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
          >
            <ArrowLeft className="size-5" />
          </Link>
        </div>

        <section aria-live="polite" className="fh-arch-card glow-hero border bg-card p-2 text-center">
          <div className="fh-arch surface-hero relative h-40 overflow-hidden bg-hero ring-2 ring-amber/60">
            {cover && <BlurImage src={cover} alt="" sizes="(min-width: 448px) 400px, 90vw" className="object-cover opacity-45" />}
            <Image
              src={delivered ? "/foodhub/happy.webp" : "/foodhub/excited.webp"}
              alt=""
              width={176}
              height={176}
              priority
              className="animate-pop-in absolute inset-x-0 bottom-0 mx-auto size-32 object-contain"
            />
          </div>
          <div className="relative z-10 -mt-3 flex flex-col items-center px-3">
            <span aria-hidden="true" className="absolute -top-2 left-1/2 flex w-32 -translate-x-1/2 justify-between">
              <span className="block h-4 w-0.5 rounded-full bg-amber" />
              <span className="block h-4 w-0.5 rounded-full bg-amber" />
            </span>
            <p className="surface-hero relative rounded-xl bg-hero px-5 py-1.5 font-heading text-title leading-tight font-bold text-hero-foreground shadow-raised">
              {delivered ? "Delivered. Enjoy!" : "Handi's promise"}
            </p>
          </div>
          <div className="px-4 pt-2 pb-3">
            {!delivered && (
              <p>
                <span className="block text-sm text-muted-foreground">Your food will be delivered by</span>
                <span className="block font-heading text-headline font-bold text-primary">{timeFmt.format(due)}</span>
              </p>
            )}
            <p className={cn("text-sm text-muted-foreground", !delivered && "mt-1")}>
              {delivered
                ? `Hope you loved it. Thanks for ordering from ${order.restaurantName}!`
                : `Sent to ${partner.brand} on WhatsApp. They'll confirm it there.`}
            </p>
          </div>
        </section>

        {!delivered && (
          <a
            href={partnerWhatsAppUrl(partner, formatStoredMobile(profile.phone), order.items)}
            className="glow-hero mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-success text-lg font-bold text-success-foreground outline-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/80"
          >
            <MessageCircle className="size-5" aria-hidden="true" />
            Open WhatsApp again and send it
          </a>
        )}

        <div className="mt-5 drop-shadow-sm">
          <div className="fh-receipt bg-card p-5">
            <h2 className="font-heading text-title font-bold">What&apos;s in the bag</h2>
            <ul className="mt-2 divide-y divide-dashed">
              {order.items.map((item) => {
                const photo = getDishPhoto(order.restaurantName, item.name);
                return (
                  <li key={item.name} className="flex items-center gap-3 py-2.5">
                    <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft font-heading font-bold text-brand-soft-foreground ring-1 ring-amber/70">
                      {photo ? (
                        <BlurImage src={photo} alt="" sizes="44px" className="object-cover" />
                      ) : (
                        <span aria-hidden="true">{item.name.trim().charAt(0)}</span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="font-semibold tabular-nums">{item.quantity} ×</span> {item.name}
                    </span>
                    <span className="text-sm tabular-nums">{formatRupees(item.quantity * item.price)}</span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 flex items-center justify-between border-t border-dashed pt-3">
              <p className="font-semibold">To pay on delivery</p>
              <p className="font-heading text-xl font-bold text-primary tabular-nums">{formatRupees(order.totalAmount)}</p>
            </div>
          </div>
        </div>

        <section className="surface-hero glow-hero relative mt-5 -rotate-1 rounded-[1.4rem] bg-hero p-5 pl-11 text-hero-foreground">
          <span
            aria-hidden="true"
            className="absolute top-1/2 left-4 size-4 -translate-y-1/2 rounded-full bg-background ring-2 ring-hero-accent/70"
          />
          <h1 className="font-heading text-3xl leading-tight font-bold">{order.restaurantName}</h1>
          <p className="mt-1 text-sm text-hero-foreground/85">
            A MuteBites × {partner.brand} order · {formatTime(order.createdAt)}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm">
            <MapPin className="size-4 shrink-0 text-hero-accent" aria-hidden="true" />
            <span>
              Delivered by <strong className="font-semibold">{partner.brand}</strong> · pay on delivery
            </span>
          </p>
        </section>

        <div className="mt-4 flex items-center gap-2 rounded-[1.4rem] border bg-card py-2 pr-3 pl-2 shadow-card">
          <Image src="/foodhub/side.webp" alt="" width={56} height={56} className="size-14 object-contain" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">Something wrong?</p>
            <p className="font-semibold">Contact {partner.brand}</p>
          </div>
          <a
            href={`tel:${phone}`}
            aria-label={`Call ${partner.brand}`}
            className="flex size-11 items-center justify-center rounded-full bg-secondary outline-none hover:bg-border focus-visible:ring-3 focus-visible:ring-ring/80"
          >
            <Phone className="size-5" aria-hidden="true" />
          </a>
          <a
            href={`https://wa.me/${partner.whatsapp}?text=${encodeURIComponent(waText)}`}
            aria-label={`WhatsApp ${partner.brand}`}
            className="flex size-11 items-center justify-center rounded-full bg-success text-success-foreground outline-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/80"
          >
            <MessageCircle className="size-5" aria-hidden="true" />
          </a>
        </div>
      </ViewTransition>
    </main>
  );
}
