"use client";

import { useState, useTransition } from "react";
import { BadgeCheck, Loader2, MessageCircle, ShieldCheck, Truck } from "lucide-react";
import { CartLineRow } from "@/components/cart/cart-line-row";
import { ConfettiBurst } from "@/components/orders/confetti-burst";
import { IconTile } from "@/components/icon-tile";
import { Textarea } from "@/components/ui/textarea";
import { MAX_NOTES } from "@/lib/cart/limits";
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
  orderingEnabled,
  suggestedNote,
  onDone,
}: {
  cart: Cart;
  partner: Partner;
  /** The restaurant's own Kitchen switch. */
  orderingEnabled: boolean;
  suggestedNote: string | null;
  onDone: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sentUrl, setSentUrl] = useState<string | null>(null);
  const [sending, startSending] = useTransition();
  const { amount } = cartTotals(cart);

  function send() {
    if (!cart.restaurantId) return;
    setError(null);
    startSending(async () => {
      const res = await preparePartnerOrder({
        restaurantId: cart.restaurantId!,
        lines: cart.lines.map((l) => ({ dishId: l.dishId, quantity: l.quantity })),
        notes,
      });
      if (!res.ok) {
        setError(res.error);
        if (res.removedDishIds?.length) reconcileCart(res.removedDishIds, res.updatedPrices ?? []);
        return;
      }
      setSentUrl(res.url);
      window.location.href = res.url;
    });
  }

  if (sentUrl) {
    return (
      <div className="relative overflow-hidden px-6 pt-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center">
        <div className="pointer-events-none absolute inset-0 motion-reduce:hidden">
          <ConfettiBurst />
        </div>
        <span className="offer-stamp mx-auto flex size-20 items-center justify-center rounded-full bg-success text-success-foreground shadow-raised">
          <MessageCircle className="size-10" strokeWidth={2.25} aria-hidden="true" />
        </span>
        <h2 className="mt-5 font-heading text-headline font-bold">Tap Send in WhatsApp</h2>
        <p className="mx-auto mt-2 max-w-xs text-muted-foreground">
          Your order is typed out in {partner.brand}&apos;s chat. Send it, and they&apos;ll confirm it and the
          delivery time there.
        </p>
        <div className="mt-7 space-y-3">
          <a
            href={sentUrl}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-success text-lg font-bold text-success-foreground outline-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/80"
          >
            <MessageCircle className="size-5" aria-hidden="true" />
            Open WhatsApp again
          </a>
          <button
            type="button"
            onClick={() => {
              clearCart();
              onDone();
            }}
            className="flex h-12 w-full items-center justify-center rounded-full bg-secondary font-semibold outline-none hover:bg-border focus-visible:ring-3 focus-visible:ring-ring/80"
          >
            I&apos;ve sent it
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 [mask-image:linear-gradient(to_bottom,#000_calc(100%-1.5rem),transparent)]">
        <ul>
          {cart.lines.map((line) => (
            <CartLineRow key={lineKey(line)} line={line} restaurantName={cart.restaurantName} />
          ))}
        </ul>

        <label className="mt-5 block">
          <span className="sr-only">Note for {partner.brand}</span>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={MAX_NOTES}
            rows={2}
            placeholder={`Note for ${partner.brand}, e.g. “less spicy”`}
            className="min-h-14 resize-none rounded-2xl bg-card px-5 py-4 text-base shadow-card md:text-base"
          />
        </label>
        {suggestedNote && !notes.toLowerCase().includes(suggestedNote.toLowerCase()) && (
          <button
            type="button"
            onClick={() => setNotes((n) => (n.trim() ? `${n.trim()}. ${suggestedNote}` : suggestedNote))}
            className="mt-2 inline-flex h-9 items-center rounded-full bg-brand-soft px-3.5 text-sm font-semibold text-brand-soft-foreground outline-none hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring/80"
          >
            + {suggestedNote}
          </button>
        )}

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
              <p className="text-sm text-muted-foreground">With your name, phone and a MuteBites verify link.</p>
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
