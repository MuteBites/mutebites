"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, MapPin, Search, Undo2, X } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { advanceOrderStatus } from "@/lib/admin/actions";
import type { AdminOrder } from "@/lib/data/admin";
import { formatRupees } from "@/lib/format";
import { itemLine } from "@/lib/orders/admin-text";
import { formatOrderNumber } from "@/lib/orders/status";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

/** How long a tick can be undone before it's saved. */
const UNDO_MS = 4000;

/**
 * Handover mode (mobile admin step 3, 12 Nov 2026), for the Main Gate:
 * today's confirmed orders sorted by token, each a big token, the name,
 * the dishes and the cash to take. Tap the tick when they've collected it:
 * the card turns green with an Undo for a few seconds, then it's saved as
 * delivered (advanceOrderStatus — compare-and-swapped on "confirmed") and
 * the student is notified. The totals up top: collected today, and what's
 * still to hand over. The search box takes a token number straight away
 * (numeric keyboard), or a name.
 */
export function HandoverView({ orders, collected }: { orders: AdminOrder[]; collected: { orders: number; amount: number } }) {
  const router = useRouter();
  // id → epoch ms when the tick will be saved; "saved" once it has been.
  const [ticked, setTicked] = useState<Record<string, number | "saved">>({});
  const timers = useRef(new Map<string, { timer: number; order: AdminOrder }>());
  const [query, setQuery] = useState("");

  // Leaving the page mid-undo saves those ticks straight away, never drops them.
  useEffect(() => {
    const pending = timers.current;
    return () =>
      pending.forEach(({ timer, order }) => {
        window.clearTimeout(timer);
        void advanceOrderStatus(order.id, "confirmed");
      });
  }, []);

  function save(order: AdminOrder) {
    timers.current.delete(order.id);
    advanceOrderStatus(order.id, "confirmed").then((result) => {
      if (result.ok) {
        setTicked((t) => ({ ...t, [order.id]: "saved" }));
        router.refresh();
      } else {
        setTicked((t) => {
          const next = { ...t };
          delete next[order.id];
          return next;
        });
        toast.error(`${formatOrderNumber(order.dailyNumber)}: ${result.error}`);
      }
    });
  }

  function tick(order: AdminOrder) {
    navigator.vibrate?.(15);
    setTicked((t) => ({ ...t, [order.id]: Date.now() + UNDO_MS }));
    timers.current.set(order.id, { timer: window.setTimeout(() => save(order), UNDO_MS), order });
  }

  function undo(order: AdminOrder) {
    const pending = timers.current.get(order.id);
    if (pending) window.clearTimeout(pending.timer);
    timers.current.delete(order.id);
    setTicked((s) => {
      const next = { ...s };
      delete next[order.id];
      return next;
    });
  }

  const doneHere = orders.filter((o) => ticked[o.id] !== undefined);
  const left = orders.filter((o) => ticked[o.id] === undefined);
  const collectedNow = {
    orders: collected.orders + doneHere.filter((o) => ticked[o.id] === "saved").length,
    amount: collected.amount + doneHere.filter((o) => ticked[o.id] === "saved").reduce((n, o) => n + o.totalAmount, 0),
  };

  const q = query.trim().toLowerCase().replace(/^#/, "");
  const shown = q
    ? orders.filter((o) => String(o.dailyNumber) === q || o.studentName.toLowerCase().includes(q))
    : orders;

  return (
    <>
      <section className="surface-hero glow-hero relative grid grid-cols-2 gap-4 overflow-hidden rounded-3xl bg-hero px-5 py-4 text-hero-foreground">
        <div className="min-w-0">
          <p className="text-sm text-hero-foreground/85">Collected today</p>
          <p className="font-heading text-3xl font-bold tabular-nums">{formatRupees(collectedNow.amount)}</p>
          <p className="text-sm text-hero-foreground/85">{collectedNow.orders} delivered</p>
        </div>
        <div className="min-w-0 text-right">
          <p className="text-sm text-hero-foreground/85">Still to hand over</p>
          <p className="font-heading text-3xl font-bold tabular-nums">{left.length}</p>
          <p className="text-sm text-hero-foreground/85">{formatRupees(left.reduce((n, o) => n + o.totalAmount, 0))} to take</p>
        </div>
      </section>

      {orders.length === 0 ? (
        <EmptyState icon={MapPin} title="Nothing to hand over" compact>
          Confirmed orders show up here, sorted by token, ready for the gate.
        </EmptyState>
      ) : (
        <>
          <label className="relative block">
            <span className="sr-only">Find a token or name</span>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="text"
              inputMode="numeric"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Token number"
              className="h-14 w-full rounded-full border border-input bg-card pr-12 pl-12 font-heading text-2xl font-bold shadow-card outline-none placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/80"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear"
                className="absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            )}
          </label>

          {shown.length === 0 ? (
            <EmptyState icon={Search} title="No order with that token" compact>
              It may not be confirmed yet — check the Orders tab.
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-3">
              {shown.map((order) => {
                const state = ticked[order.id];
                const done = state !== undefined;
                return (
                  <li key={order.id}>
                    <article
                      className={cn(
                        "flex items-center gap-4 rounded-3xl border bg-card p-3.5 shadow-card transition-colors duration-(--dur-base)",
                        done && "border-success/40 bg-success-soft",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-18 shrink-0 items-center justify-center rounded-2xl font-heading text-3xl font-bold tabular-nums",
                          done ? "bg-success text-success-foreground" : "surface-hero bg-hero text-hero-foreground",
                        )}
                      >
                        {order.dailyNumber}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-lg font-semibold">{order.studentName}</p>
                        <p className={cn("font-heading text-xl font-bold tabular-nums", done ? "text-success" : "text-primary")}>
                          {formatRupees(order.totalAmount)}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {done
                            ? state === "saved"
                              ? "Delivered"
                              : "Marking delivered…"
                            : `${order.restaurantName} · ${order.items.map(itemLine).join(", ")}`}
                        </p>
                      </div>
                      {state === "saved" ? (
                        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
                          <Check className="size-6" strokeWidth={2.5} aria-hidden="true" />
                          <span className="sr-only">Delivered</span>
                        </span>
                      ) : done ? (
                        <button
                          type="button"
                          onClick={() => undo(order)}
                          className="flex h-14 shrink-0 items-center gap-1.5 rounded-full border bg-card px-4 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/80 max-[359px]:px-4"
                        >
                          <Undo2 className="size-4" aria-hidden="true" />
                          <span className="max-[359px]:sr-only">Undo</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => tick(order)}
                          aria-label={`Mark ${formatOrderNumber(order.dailyNumber)} delivered`}
                          className="surface-primary glow-amber flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
                        >
                          <Check className="size-6" strokeWidth={2.5} aria-hidden="true" />
                        </button>
                      )}
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </>
  );
}
