"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Gift } from "lucide-react";
import { ConfettiBurst } from "@/components/orders/confetti-burst";
import { cartDeals } from "@/lib/deals";
import { cartTotals, useCart, lineKey } from "@/lib/cart/store";
import { getDishPhoto, isUploadedPhoto } from "@/lib/data/dish-photos";
import { formatRupees } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OffersState } from "@/lib/offers";
import { CartSheet } from "./cart-sheet";

/**
 * Floating "N items · ₹X · View cart" bar plus the cart sheet it opens.
 * Hidden while the cart is empty (the sheet stays open if you empty it).
 */
export function CartBar({
  profilePhone,
  currentRestaurantId,
  orderingEnabled,
  closedNote,
  spiceLevel = null,
  offers,
  hasTabBar = false,
}: {
  profilePhone: string;
  /** On a menu page: names the cart's restaurant when it's a different one. */
  currentRestaurantId?: string;
  /** Campus-wide kill switch — disables checkout in the cart sheet when off. */
  orderingEnabled: boolean;
  /** Why ordering is shut ("Ordering opens again at 1:30 PM"), shown in the cart sheet. */
  closedNote?: string;
  /** The taste profile's spice answer — offers a one-tap spice note in the cart. */
  spiceLevel?: number | null;
  /** Discount offers the admin has on (getOffers()) — the cart's "Apply discount" bar. */
  offers?: OffersState;
  /** True on pages where the floating <TabBar/> shows (Home) — stacks the bar above it. */
  hasTabBar?: boolean;
}) {
  const cart = useCart();
  const [open, setOpen] = useState(false);
  const totals = cartTotals(cart);
  const cartIsElsewhere = cart.restaurantId !== null && cart.restaurantId !== currentRestaurantId;

  // Restaurant deals (FoodHub's cart bar, 26 Nov 2026): a nudge while one is
  // close, the price after the deal's money off, and a "Deal unlocked!" pill
  // with confetti each time the cart earns a new one.
  const deals = offers ? cartDeals(cart.lines, offers.deals) : { applied: [], next: null };
  const dealOff = deals.applied.reduce((n, d) => n + d.off, 0);
  const toPay = Math.max(totals.amount - dealOff, 0);
  const level = deals.applied.map((d) => d.key).join();
  const [prevLevel, setPrevLevel] = useState(level);
  const [unlocked, setUnlocked] = useState<{ key: string; text: string } | null>(null);
  if (level !== prevLevel) {
    const before = prevLevel.split(",");
    setPrevLevel(level);
    const fresh = deals.applied.find((d) => !before.includes(d.key));
    if (fresh) {
      setUnlocked({
        key: level,
        text: fresh.off > 0 ? `Deal unlocked! You save ${formatRupees(fresh.off)}` : `${fresh.label} unlocked!`,
      });
    }
  }
  const nudge = deals.next && !cartIsElsewhere ? deals.next.text : null;

  return (
    <>
      {totals.items > 0 && (
        <>
          {/* Spacer so page content isn't hidden behind the bar. */}
          <div className="h-28" aria-hidden="true" />
          <div
            className={cn(
              "animate-slide-up-in fixed inset-x-0 z-20 mx-auto w-full max-w-md px-4",
              hasTabBar ? "bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.5rem)] pb-0" : "bottom-0 pb-[max(1rem,env(safe-area-inset-bottom))]",
            )}
          >
            {unlocked && (
              <div
                key={unlocked.key}
                role="status"
                className="deal-pill pointer-events-none absolute inset-x-4 -top-14 flex justify-center motion-reduce:hidden"
                onAnimationEnd={(e) => e.target === e.currentTarget && setUnlocked(null)}
              >
                <div className="relative overflow-visible">
                  <div className="absolute -inset-x-10 -top-10 h-44">
                    <ConfettiBurst />
                  </div>
                  <p className="surface-primary glow-amber relative flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-bold text-primary-foreground shadow-card">
                    <Gift className="offer-stamp size-5 shrink-0" aria-hidden="true" />
                    {unlocked.text}
                  </p>
                </div>
              </div>
            )}
            <div className="surface-hero glow-hero relative flex items-center gap-3 rounded-full bg-hero p-2 pl-3 text-hero-foreground">
              {/* The actual food in the cart, not just a count: up to two
                  dish photos overlapping, falling back to the dish's initial.
                  Dropped below 360px so the total never gets squeezed. */}
              <div className="flex shrink-0 -space-x-3 max-[359px]:hidden" aria-hidden="true">
                {cart.lines.slice(0, 2).map((line) => {
                  const photo = cart.restaurantName ? getDishPhoto(cart.restaurantName, line.name) : undefined;
                  return (
                    <span
                      key={lineKey(line)}
                      className="animate-pop-in relative flex size-11 items-center justify-center overflow-hidden rounded-full bg-hero-foreground/15 font-heading text-lg font-bold ring-2 ring-hero"
                    >
                      {photo ? (
                        <Image src={photo} alt="" fill sizes="44px" unoptimized={isUploadedPhoto(photo)} className="object-cover" />
                      ) : (
                        line.name.trim().charAt(0)
                      )}
                    </span>
                  );
                })}
              </div>
              <div className="min-w-0 flex-1">
                {nudge ? (
                  <p key={nudge} className="animate-pop-in truncate text-xs font-semibold text-hero-accent">
                    {nudge}
                  </p>
                ) : (
                  <p className="truncate text-sm opacity-75">
                    <span key={totals.items} className="animate-bounce-count inline-block">
                      {totals.items}
                    </span>{" "}
                    {totals.items === 1 ? "item" : "items"}
                    {cartIsElsewhere && ` · ${cart.restaurantName}`}
                  </p>
                )}
                <p className="flex items-baseline gap-2">
                  <span key={toPay} className="animate-bounce-count inline-block font-heading text-2xl font-bold">
                    {formatRupees(toPay)}
                  </span>
                  {dealOff > 0 && (
                    <s key={`was-${toPay}`} className="offer-rise-in text-sm text-hero-foreground/85 tabular-nums">
                      {formatRupees(totals.amount)}
                    </s>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="surface-primary glow-amber flex h-14 shrink-0 items-center gap-2 rounded-full bg-primary px-5 text-lg font-bold text-primary-foreground outline-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-hero-foreground/80"
              >
                View cart <ArrowRight className="size-5" />
              </button>
            </div>
          </div>
        </>
      )}
      <CartSheet
        open={open}
        onOpenChange={setOpen}
        profilePhone={profilePhone}
        orderingEnabled={orderingEnabled}
        closedNote={closedNote}
        spiceLevel={spiceLevel}
        offers={offers}
      />
    </>
  );
}
