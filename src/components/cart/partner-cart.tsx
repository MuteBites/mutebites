"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Loader2, MessageCircle, ShieldCheck, Truck } from "lucide-react";
import { CartLineRow } from "@/components/cart/cart-line-row";
import { DealsCard } from "@/components/cart/deals-card";
import { cartDeals, type DealKey, type DealsState } from "@/lib/deals";
import { IconTile } from "@/components/icon-tile";
import { cartTotals, clearCart, lineKey, reconcileCart, type Cart } from "@/lib/cart/store";
import { formatRupees } from "@/lib/format";
import type { Partner } from "@/lib/partners";
import { preparePartnerOrder } from "@/lib/partners/actions";
import { cn } from "@/lib/utils";

/**
 * The cart for a partner restaurant (Spice Magic, FoodHub's collab): no
 * offers, deals, delivery slot or contact picker. "Place order on WhatsApp"
 * checks the cart on the server, then opens FoodHub's WhatsApp with the
 * order typed out and a verify link; the sheet turns into "Tap Send in
 * WhatsApp" with a way back in. Nothing is saved; Done empties the cart.
 */
export function PartnerCart({
  cart,
  partner,
  deals,
  orderingEnabled,
  onDone,
}: {
  cart: Cart;
  partner: Partner;
  /** Restaurant deals the admin has on (Spice Magic's FoodHub deal). */
  deals: DealsState;
  /** The restaurant's own Kitchen switch. */
  orderingEnabled: boolean;
  onDone: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();
  const { amount } = cartTotals(cart);
  const [picks, setPicks] = useState<Partial<Record<DealKey, string[]>>>({});
  const earned = cartDeals(cart.lines, deals, picks);

  function send() {
    if (!cart.restaurantId) return;
    setError(null);
    startSending(async () => {
      const res = await preparePartnerOrder({
        restaurantId: cart.restaurantId!,
        lines: cart.lines.map((l) => ({ dishId: l.dishId, quantity: l.quantity })),
        notes: "",
        dealChoices: picks,
      });
      if (!res.ok) {
        setError(res.error);
        if (res.removedDishIds?.length) reconcileCart(res.removedDishIds, res.updatedPrices ?? []);
        return;
      }
      // Straight to the order's tracking page (it has "Send on WhatsApp"
      // again), with WhatsApp opening over it.
      clearCart();
      onDone();
      // WhatsApp first, always: the tracking page only opens once the
      // student comes back from it (the page was hidden), so the two never
      // race. If WhatsApp never took over (no app), it opens after 4 s.
      const track = `/orders/fh/${res.orderId}`;
      let left = false;
      let done = false;
      const go = () => {
        if (done) return;
        done = true;
        document.removeEventListener("visibilitychange", onVis);
        router.push(track, { transitionTypes: ["nav-forward"] });
      };
      const onVis = () => {
        if (document.visibilityState === "hidden") left = true;
        else if (left) go();
      };
      document.addEventListener("visibilitychange", onVis);
      window.setTimeout(() => {
        if (!left && document.visibilityState === "visible") go();
      }, 4000);
      window.location.href = res.url;
    });
  }

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 [mask-image:linear-gradient(to_bottom,#000_calc(100%-1.5rem),transparent)]">
        <ul>
          {cart.lines.map((line) => (
            <CartLineRow key={lineKey(line)} line={line} restaurantName={cart.restaurantName} />
          ))}
        </ul>

        <DealsCard
          applied={earned.applied}
          next={earned.next}
          picks={picks}
          onPick={(key, choice) => setPicks((p) => ({ ...p, [key]: choice }))}
        />

        <div className="mt-4 divide-y overflow-hidden rounded-[1.5rem] border bg-card shadow-card">
          <div className="flex items-center gap-3.5 px-5 py-4">
            <IconTile>
              <Truck className="size-5" aria-hidden="true" />
            </IconTile>
            <div>
              <p className="font-semibold">Delivered by {partner.brand}</p>
              <p className="text-sm text-muted-foreground">
                They&apos;ll confirm the time on WhatsApp. Pay {partner.brand} on delivery.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 px-5 py-4">
            <IconTile>
              <BadgeCheck className="size-5" aria-hidden="true" />
            </IconTile>
            <div>
              <p className="font-semibold">Sent from your WhatsApp</p>
              <p className="text-sm text-muted-foreground">Your phone number and the dishes, typed out for you.</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-baseline justify-between px-1">
          <span className="font-semibold">To pay</span>
          <span key={amount} className="animate-bounce-count font-heading text-2xl font-bold text-primary tabular-nums">
            {formatRupees(amount)}
          </span>
        </div>
        <p className="mt-3 flex gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          Fake orders get your number banned from MuteBites and {partner.brand}.
        </p>
      </div>

      <footer className="border-t bg-background px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {!orderingEnabled && (
          <p className="mb-3 text-center text-sm text-muted-foreground">{cart.restaurantName} is closed right now.</p>
        )}
        {error && (
          <p id="partner-order-error" role="alert" className="mb-3 text-center text-sm text-destructive">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={send}
          disabled={sending || !orderingEnabled}
          aria-describedby={error ? "partner-order-error" : undefined}
          className={cn(
            "glow-hero flex h-14 w-full items-center justify-between gap-2 rounded-full bg-success px-6 text-lg font-bold text-success-foreground outline-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/80 disabled:opacity-70 disabled:shadow-none",
            sending && "animate-shimmer",
          )}
        >
          <span className="flex items-center gap-2">
            {sending ? <Loader2 className="size-5 animate-spin" /> : <MessageCircle className="size-5" aria-hidden="true" />}
            {sending ? "Opening WhatsApp…" : "Place order on WhatsApp"}
          </span>
          <span className="font-heading text-xl tabular-nums">{formatRupees(amount)}</span>
        </button>
      </footer>
    </>
  );
}
