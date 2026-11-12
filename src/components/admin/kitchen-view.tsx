"use client";

import { useMemo, useState } from "react";
import { Check, ChefHat, Copy, MessageCircle } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import type { AdminOrder } from "@/lib/data/admin";
import type { DeliveryInfo } from "@/lib/delivery";
import { buildKitchen, kitchenText, type KitchenRestaurant } from "@/lib/orders/kitchen";
import { formatOrderNumber } from "@/lib/orders/status";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

/**
 * The Kitchen tab (mobile admin step 2, 12 Nov 2026): today's confirmed
 * orders by when they're due (lunch, or each restaurant's set time), then per restaurant with every dish summed, and
 * a Copy / WhatsApp button per restaurant so each gets one list per slot.
 * New (not yet confirmed) orders can be added with the switch — off by
 * default, since a restaurant should only cook what's been confirmed.
 * WhatsApp opens the share picker (wa.me with no number): every restaurant
 * row still carries MuteBites' own number, so the admin picks the contact.
 */
export function KitchenView({
  confirmed,
  pending,
  delivery = {},
}: {
  confirmed: AdminOrder[];
  pending: AdminOrder[];
  /** Restaurants' delivery times — the lists group by when orders are due. */
  delivery?: Record<string, DeliveryInfo>;
}) {
  const [withNew, setWithNew] = useState(false);
  const slots = useMemo(
    () => buildKitchen(withNew ? [...confirmed, ...pending] : confirmed, delivery),
    [confirmed, pending, withNew, delivery],
  );
  const [picked, setPicked] = useState<string | null>(null);
  const slot = slots.find((s) => s.key === picked) ?? slots[0];

  return (
    <>
      {pending.length > 0 && (
        <button
          type="button"
          role="switch"
          aria-checked={withNew}
          onClick={() => setWithNew((v) => !v)}
          className="flex items-center justify-between gap-3 rounded-3xl border bg-card px-4 py-3 text-left shadow-card outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
        >
          <span className="min-w-0">
            <span className="block font-semibold">Include new orders</span>
            <span className="block text-sm text-muted-foreground">
              {withNew
                ? `${pending.length} unconfirmed ${pending.length === 1 ? "order is" : "orders are"} in the lists`
                : `${pending.length} unconfirmed ${pending.length === 1 ? "order isn't" : "orders aren't"} in the lists yet`}
            </span>
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-(--dur-base)",
              withNew ? "surface-slider glow-slider bg-slider" : "bg-input",
            )}
          >
            <span
              className={cn(
                "absolute top-1 left-1 size-5 rounded-full bg-card shadow-card transition-transform duration-(--dur-base) ease-spring",
                withNew && "translate-x-5",
              )}
            />
          </span>
        </button>
      )}

      {!slot ? (
        <EmptyState icon={ChefHat} title="Nothing to cook yet" compact>
          Confirmed orders show up here, summed per restaurant.
        </EmptyState>
      ) : (
        <>
          {slots.length > 1 && (
            <div role="tablist" aria-label="Delivery slot" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
              {slots.map((s) => {
                const on = s.key === slot.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setPicked(s.key)}
                    className={cn(
                      "flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/80",
                      on ? "surface-ink border-transparent bg-ink text-ink-foreground" : "bg-card shadow-card",
                    )}
                  >
                    {s.label}
                    <span className="text-xs opacity-85">{s.orders}</span>
                  </button>
                );
              })}
            </div>
          )}

          <section className="surface-hero glow-hero relative overflow-hidden rounded-3xl bg-hero px-5 py-4 text-hero-foreground">
            <h2 className="font-heading text-title font-bold">{slot.label}</h2>
            <p className="text-sm text-hero-foreground/85">
              {slot.orders} {slot.orders === 1 ? "order" : "orders"} · {slot.restaurants.length}{" "}
              {slot.restaurants.length === 1 ? "restaurant" : "restaurants"}
            </p>
          </section>

          <ul className="flex flex-col gap-3">
            {slot.restaurants.map((r) => (
              <li key={r.restaurantId}>
                <RestaurantCard restaurant={r} slotLabel={slot.label} />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function RestaurantCard({ restaurant: r, slotLabel }: { restaurant: KitchenRestaurant; slotLabel: string }) {
  const [copied, setCopied] = useState(false);
  const text = kitchenText(r, slotLabel);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(`${r.restaurantName}'s list copied.`);
    } catch {
      toast.error("Couldn't copy — your browser blocked it.");
    }
  }

  return (
    <article className="rounded-3xl border bg-card p-4 shadow-card">
      <header className="flex items-baseline justify-between gap-3">
        <h3 className="min-w-0 truncate font-heading text-lg font-bold">{r.restaurantName}</h3>
        <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
          {r.items} {r.items === 1 ? "item" : "items"}
        </span>
      </header>
      <ul className="mt-2 divide-y divide-dashed">
        {r.lines.map((l) => (
          <li key={`${l.name}|${l.free}`} className="flex items-baseline justify-between gap-3 py-2">
            <span className="min-w-0">
              {l.name}
              {l.free && (
                <span className="ml-2 rounded-full bg-success-soft px-2 py-0.5 text-xs font-bold text-success">Free</span>
              )}
            </span>
            <span className="shrink-0 font-heading text-lg font-bold text-primary tabular-nums">× {l.quantity}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm text-muted-foreground">Orders {r.tokens.map(formatOrderNumber).join(", ")}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={copy}
          className="flex h-11 items-center justify-center gap-2 rounded-full bg-brand-soft text-sm font-semibold text-brand-soft-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
        >
          {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          Copy list
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 items-center justify-center gap-2 rounded-full bg-success-soft text-sm font-semibold text-success outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          WhatsApp
        </a>
      </div>
    </article>
  );
}
