"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Phone, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { CartLineRow } from "@/components/cart/cart-line-row";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { MAX_NOTES } from "@/lib/cart/limits";
import { cartTotals, clearCart, reconcileCart, useCart, type Cart } from "@/lib/cart/store";
import { formatRupees } from "@/lib/format";
import { placeOrder } from "@/lib/orders/actions";
import { formatLocalMobile, formatStoredMobile, normalizeIndianMobile } from "@/lib/phone";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

const eyebrow = "text-label text-muted-foreground";

export function CartSheet({
  open,
  onOpenChange,
  profilePhone,
  orderingEnabled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Stored "+91XXXXXXXXXX" — the default contact number for the order. */
  profilePhone: string;
  /** Campus-wide kill switch — disables the "Place order" button when off. */
  orderingEnabled: boolean;
}) {
  const cart = useCart();
  const empty = cart.lines.length === 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto max-h-[92dvh] w-full max-w-md gap-0 rounded-t-[2rem] border-t-0 bg-background p-0 text-base"
      >
        <header className="flex items-start gap-3 border-b px-6 pt-6 pb-4">
          <div className="min-w-0 flex-1">
            <SheetTitle className="font-heading text-headline font-bold">Your cart</SheetTitle>
            <SheetDescription className={cn("mt-0.5 truncate text-base", empty && "sr-only")}>
              {empty
                ? "Your cart is empty"
                : `${cart.restaurantName} · ${cartTotals(cart).items} ${cartTotals(cart).items === 1 ? "item" : "items"}`}
            </SheetDescription>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close cart"
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary outline-none hover:bg-border focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            <X className="size-5" />
          </button>
        </header>

        {empty ? (
          <EmptyCart onBrowse={() => onOpenChange(false)} />
        ) : (
          <CartContents
            cart={cart}
            profilePhone={profilePhone}
            orderingEnabled={orderingEnabled}
            onPlaced={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function EmptyCart({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="flex flex-col items-center px-8 pt-16 pb-20 text-center">
      <BrandLogo className="size-24 animate-bounce-idle" />
      <p className="mt-6 font-heading text-2xl font-bold">Nothing here yet</p>
      <p className="mt-2 text-muted-foreground">
        Pick a restaurant and add a few dishes — most orders take under a minute.
      </p>
      <Link
        href="/"
        onClick={onBrowse}
        className="pressable surface-ink mt-6 flex h-14 items-center rounded-2xl bg-ink px-8 text-lg font-bold text-ink-foreground outline-none hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        Browse restaurants
      </Link>
    </div>
  );
}

function CartContents({
  cart,
  profilePhone,
  orderingEnabled,
  onPlaced,
}: {
  cart: Cart;
  profilePhone: string;
  orderingEnabled: boolean;
  onPlaced: () => void;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [contactPhone, setContactPhone] = useState(profilePhone);
  const [error, setError] = useState<string | null>(null);
  const [placing, startPlacing] = useTransition();
  const { amount } = cartTotals(cart);

  function submit() {
    setError(null);
    startPlacing(async () => {
      const result = await placeOrder({
        restaurantId: cart.restaurantId!,
        lines: cart.lines.map((l) => ({ dishId: l.dishId, quantity: l.quantity, price: l.price })),
        notes,
        contactPhone,
      });
      if (result.ok) {
        clearCart();
        onPlaced();
        router.push(`/orders/${result.orderId}?placed=1`, { transitionTypes: ["nav-forward"] });
        return;
      }
      if (result.removedDishIds || result.updatedPrices) {
        reconcileCart(result.removedDishIds ?? [], result.updatedPrices ?? []);
      }
      setError(result.error);
      toast.error(result.error);
    });
  }

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-6">
        <ul>
          {cart.lines.map((line) => (
            <CartLineRow key={line.dishId} line={line} />
          ))}
        </ul>

        <label className="mt-5 block">
          <span className="sr-only">Order notes</span>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={MAX_NOTES}
            rows={2}
            placeholder="Order notes — e.g. “less spicy”"
            className="min-h-14 resize-none rounded-2xl border-0 bg-secondary px-5 py-4 text-base md:text-base"
          />
        </label>

        <div className="mt-4 mb-5 divide-y rounded-2xl border bg-card shadow-card">
          <div className="flex items-center gap-4 px-5 py-4">
            <MapPin className="size-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className={eyebrow}>Handover point</p>
              <p className="font-semibold">VIT-AP Main Gate</p>
            </div>
          </div>
          <ContactPhone value={contactPhone} onChange={setContactPhone} />
        </div>
      </div>

      <footer className="border-t px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <dl className="space-y-1.5">
          <div className="flex justify-between text-muted-foreground">
            <dt>Item total</dt>
            <dd className="tabular-nums">{formatRupees(amount)}</dd>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <dt>Delivery fee</dt>
            <dd className="font-semibold text-success">FREE</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-dashed pt-2.5">
            <dt className="text-lg font-semibold">To pay in cash</dt>
            <dd className="font-heading text-3xl font-bold tabular-nums">{formatRupees(amount)}</dd>
          </div>
        </dl>

        <div className="mt-3 rounded-2xl border border-primary/20 bg-brand-soft px-4 py-3 text-sm text-brand-soft-foreground">
          <p className="flex items-start gap-3">
            <span aria-hidden="true" className="w-4 shrink-0 text-center font-bold text-primary">
              ₹
            </span>
            <span>Cash on delivery at the gate. Please carry exact change.</span>
          </p>
          <p className="mt-1.5 flex items-center gap-3">
            <span aria-hidden="true" className="w-4 shrink-0 text-center">
              📱
            </span>
            <span>Scan and pay through UPI too</span>
          </p>
        </div>

        {!orderingEnabled && (
          <p className="mt-3 rounded-2xl bg-secondary px-4 py-3 text-center text-sm">
            Ordering is paused campus-wide right now. Try again in a bit.
          </p>
        )}

        {error && (
          <p id="place-order-error" role="alert" className="mt-3 text-center text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={placing || !orderingEnabled}
          aria-describedby={error ? "place-order-error" : undefined}
          className="surface-primary mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-bold text-primary-foreground outline-none hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-70"
        >
          {placing && <Loader2 className="size-5 animate-spin" />}
          {placing ? "Placing order…" : `Place order · ${formatRupees(amount)}`}
        </button>
      </footer>
    </>
  );
}

/** The order's contact number. Changing it here affects only this order. */
function ContactPhone({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [invalid, setInvalid] = useState(false);

  function save() {
    const normalized = normalizeIndianMobile(draft);
    if (!normalized) return setInvalid(true);
    onChange(normalized);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-4 px-5 py-4">
        <Phone className="size-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className={eyebrow}>Your number</p>
          <p className="font-semibold tabular-nums">{formatStoredMobile(value)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Make sure this is your WhatsApp number before placing the order.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setDraft(formatLocalMobile(value.replace(/^\+91/, "")));
            setInvalid(false);
            setEditing(true);
          }}
          className="rounded-md font-semibold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 py-4">
      <label htmlFor="contact-phone" className={eyebrow}>
        Number for this order
      </label>
      <div className="mt-2 flex gap-2">
        <div
          className={cn(
            "flex h-12 min-w-0 flex-1 items-center rounded-xl border bg-background focus-within:border-ring",
            invalid && "border-destructive focus-within:border-destructive",
          )}
        >
          <span className="pl-3 text-muted-foreground">+91</span>
          <span className="mx-2 h-6 w-px bg-border" aria-hidden="true" />
          <input
            id="contact-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            autoFocus
            value={draft}
            onChange={(e) => {
              setDraft(formatLocalMobile(e.target.value));
              setInvalid(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && save()}
            aria-invalid={invalid || undefined}
            aria-describedby="contact-phone-hint"
            className="h-full min-w-0 flex-1 bg-transparent pr-3 tabular-nums outline-none"
          />
        </div>
        <button
          type="button"
          onClick={save}
          className="h-12 rounded-xl bg-primary px-4 font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          Save
        </button>
      </div>
      <p id="contact-phone-hint" className={cn("mt-1.5 text-sm", invalid ? "text-destructive" : "text-muted-foreground")}>
        {invalid ? "Enter a valid 10-digit mobile number." : "Only for this order — your profile number stays the same."}
      </p>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="mt-1 text-sm font-medium text-muted-foreground hover:underline"
      >
        Cancel
      </button>
    </div>
  );
}
