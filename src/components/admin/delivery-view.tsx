"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareText, Pencil, Phone, Plus, Trash2, Truck } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { delayBatch, removeBatch, setDeliveryMode } from "@/lib/admin/delivery-actions";
import type { AdminRestaurant } from "@/lib/data/admin";
import { formatTime } from "@/lib/date";
import { LUNCH_WINDOW, openBatch, type Batch } from "@/lib/delivery";
import { formatStoredMobile } from "@/lib/phone";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";
import { DeliveryDialog } from "./delivery-dialog";

type Target = { restaurants: { id: string; name: string }[]; batch?: Batch; normal?: boolean } | null;

/**
 * The admin's Delivery tab (12 Nov 2026, it replaced Handover): for each
 * restaurant that's on, today's delivery batches — "orders until 7:00 PM →
 * by 7:40 PM", "until 7:40 → by 8:10" — each with its message, delivery
 * person's phone and how many open orders are in it, plus Late +15 / +30,
 * Edit and Remove. Lunch (before 12:45 PM) needs none. After 12:45 PM a
 * restaurant with no batch still open can't take orders (no fallback).
 */
export function DeliveryView({
  restaurants,
  batches,
  openByBatch,
  mode,
}: {
  /** app_settings.delivery_mode: one normal evening delivery, or batches. */
  mode: "normal" | "batches";
  restaurants: AdminRestaurant[];
  batches: Record<string, Batch[]>;
  /** Open orders per batch id. */
  openByBatch: Record<string, number>;
}) {
  const router = useRouter();
  const [target, setTarget] = useState<Target>(null);
  const [busy, startBusy] = useTransition();
  // Only restaurants that are on (Kitchen) — the client's call.
  const on = restaurants.filter((r) => r.is_active && r.delivery_minutes == null);
  const express = restaurants.filter((r) => r.is_active && r.delivery_minutes != null);
  // Normal delivery: today's shared one (any restaurant's open batch).
  const normalBatch = on.map((r) => openBatch(batches[r.id])).find(Boolean) ?? null;

  async function delayAll(m: number) {
    for (const r of on) {
      const b = openBatch(batches[r.id]);
      if (b) await delayBatch(b.id, m);
    }
    return { ok: true as const };
  }
  const allOn = on.map(({ id, name }) => ({ id, name }));
  const missing = on.filter((r) => !openBatch(batches[r.id]));

  function run(
    work: () => Promise<{ ok: true; notified?: number } | { ok: false; error: string }>,
    done: (n?: number) => string,
  ) {
    startBusy(async () => {
      const result = await work();
      if (result.ok) {
        toast.success(done(result.notified));
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const told = (n?: number) => (n ? ` ${n} ${n === 1 ? "student" : "students"} told.` : "");

  function card(r: AdminRestaurant) {
    const list = batches[r.id] ?? [];
    const open = openBatch(list);
    return (
      <li key={r.id}>
        <article className={cn("rounded-3xl border bg-card p-4 shadow-card", !open && "border-destructive/40")}>
          <header className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="min-w-0 truncate font-heading text-lg font-bold">{r.name}</h3>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold",
                open ? "bg-success-soft text-success" : "bg-destructive/10 text-destructive",
              )}
            >
              {open ? `Orders open until ${formatTime(open.orderUntil)}` : "No batch open"}
            </span>
          </header>

          {list.length === 0 ? (
            <p className="mt-2 text-sm font-semibold text-destructive">
              No batch today — after 12:45 PM students can&apos;t order until you add one.
            </p>
          ) : (
            <ol className="mt-3 flex flex-col gap-2">
              {list.map((b, i) => {
                const count = openByBatch[b.id] ?? 0;
                const closed = b.id !== open?.id && new Date(b.orderUntil).getTime() < new Date(open?.orderUntil ?? 8.64e15).getTime();
                return (
                  <li
                    key={b.id}
                    className={cn("rounded-2xl border px-3.5 py-3", b.id === open?.id ? "border-primary/40 bg-primary/5" : "bg-secondary/40")}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-muted-foreground">
                          Batch {i + 1} · orders until {formatTime(b.orderUntil)}
                          {closed && " · closed"}
                        </p>
                        <p className="font-heading text-lg leading-tight font-bold">By {formatTime(b.deliverAt)}</p>
                        <p className="text-xs text-muted-foreground">
                          {count} open {count === 1 ? "order" : "orders"}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          aria-label={`Edit batch ${i + 1}`}
                          onClick={() => setTarget({ restaurants: [{ id: r.id, name: r.name }], batch: b })}
                          className="flex size-9 items-center justify-center rounded-full border bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Remove batch ${i + 1}`}
                          disabled={busy}
                          onClick={() => run(() => removeBatch(b.id), () => `Batch ${i + 1} removed. Its orders keep their time.`)}
                          className="flex size-9 items-center justify-center rounded-full border bg-card text-destructive outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    {b.note && (
                      <p className="mt-2 flex items-start gap-2 text-sm">
                        <MessageSquareText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span>{b.note}</span>
                      </p>
                    )}
                    {b.riderPhone && (
                      <p className="mt-1 flex items-center gap-2 text-sm tabular-nums">
                        <Phone className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        {formatStoredMobile(b.riderPhone)}
                      </p>
                    )}
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="text-sm font-semibold text-muted-foreground">Late?</span>
                      {[15, 30].map((m) => (
                        <button
                          key={m}
                          type="button"
                          disabled={busy}
                          onClick={() => run(() => delayBatch(b.id, m), (n) => `Batch ${i + 1} pushed back ${m} min.${told(n)}`)}
                          className="h-9 rounded-full bg-amber-soft px-3.5 text-sm font-bold text-amber-soft-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/80 disabled:opacity-60"
                        >
                          +{m} min
                        </button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          <button
            type="button"
            onClick={() => setTarget({ restaurants: [{ id: r.id, name: r.name }] })}
            className="surface-primary mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-primary text-sm font-bold text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
          >
            <Plus className="size-4" aria-hidden="true" />
            {list.length ? "Add another batch" : "Add a batch"}
          </button>
        </article>
      </li>
    );
  }

  return (
    <>
      <section className="surface-hero glow-hero relative overflow-hidden rounded-3xl bg-hero px-5 py-4 text-hero-foreground">
        <div className="flex items-center gap-3">
          <Truck className="size-6 shrink-0 text-hero-accent" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="font-heading text-title font-bold">Today&apos;s batches</h2>
            <p className="text-sm text-hero-foreground/85">
              Lunch orders (before 12:45 PM) are always delivered {LUNCH_WINDOW}. Add the evening and night batches here.
            </p>
            {on.length > 0 && (
              <p className="mt-1 text-sm font-semibold">
                {missing.length === 0
                  ? "Every restaurant that's on has a batch open."
                  : `${missing.length} ${missing.length === 1 ? "restaurant has" : "restaurants have"} no batch open.`}
              </p>
            )}
          </div>
        </div>
        {on.length > 1 && (
          <button
            type="button"
            onClick={() => setTarget({ restaurants: allOn })}
            className="mt-3 h-10 w-full rounded-full bg-hero-foreground/12 text-sm font-semibold text-hero-foreground rim-light outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
          >
            Add one batch to all {on.length} that are on
          </button>
        )}
      </section>

      <div role="radiogroup" aria-label="Evening delivery" className="grid grid-cols-2 gap-1 rounded-full border bg-card p-1 shadow-card">
        {(["normal", "batches"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            disabled={busy}
            onClick={() =>
              mode !== m && run(() => setDeliveryMode(m), () => (m === "normal" ? "Normal delivery on." : "Batches delivery on."))
            }
            className={cn(
              "h-11 rounded-full text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/80",
              mode === m ? "surface-slider glow-slider bg-slider text-slider-foreground" : "text-muted-foreground",
            )}
          >
            {m === "normal" ? "Normal delivery" : "Batches delivery"}
          </button>
        ))}
      </div>

      {express.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {express.map((r) => `${r.name}: within ${r.delivery_minutes} min`).join(" · ")} — no batch needed.
        </p>
      )}

      {mode === "normal" ? (
        <section className="rounded-3xl border bg-card p-4 shadow-card">
          <h2 className="font-heading text-lg font-bold">Today&apos;s delivery</h2>
          {normalBatch ? (
            <div className="mt-2 text-sm">
              <p>
                Orders until <b>{formatTime(normalBatch.orderUntil)}</b> → delivered{" "}
                <b>
                  {normalBatch.deliverFrom ? `${formatTime(normalBatch.deliverFrom)}–` : "by "}
                  {formatTime(normalBatch.deliverAt)}
                </b>
              </p>
              {normalBatch.note && (
                <p className="mt-1 flex items-start gap-2">
                  <MessageSquareText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  {normalBatch.note}
                </p>
              )}
              {normalBatch.riderPhone && (
                <p className="mt-1 flex items-center gap-2 tabular-nums">
                  <Phone className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  {formatStoredMobile(normalBatch.riderPhone)}
                </p>
              )}
              <div className="mt-2.5 flex items-center gap-2">
                <span className="font-semibold text-muted-foreground">Late?</span>
                {[15, 30].map((m) => (
                  <button
                    key={m}
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => delayAll(m), () => `Pushed back ${m} min. Students told.`)}
                    className="h-9 rounded-full bg-amber-soft px-3.5 text-sm font-bold text-amber-soft-foreground disabled:opacity-60"
                  >
                    +{m} min
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm">Orders until <b>6:50 PM</b> → delivered <b>8:00–8:15 PM</b>. Set automatically when a restaurant is turned on.</p>
          )}
          <button
            type="button"
            onClick={() => setTarget({ restaurants: allOn, batch: normalBatch ?? undefined, normal: true })}
            className="surface-primary mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-primary text-sm font-bold text-primary-foreground"
          >
            <Pencil className="size-4" aria-hidden="true" />
            {normalBatch ? "Change message or phone" : "Add message or phone"}
          </button>
        </section>
      ) : on.length === 0 ? (
        <EmptyState icon={Truck} title="No restaurant is on" compact>
          Turn one on in Kitchen — after 12:45 PM it asks for a batch then.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">{on.map(card)}</ul>
      )}

      {target && (
        <DeliveryDialog
          key={target.batch?.id ?? target.restaurants.map((r) => r.id).join()}
          open
          onOpenChange={(open) => !open && setTarget(null)}
          restaurants={target.restaurants}
          batch={target.batch}
          normal={target.normal}
          allOn={!target.batch && target.restaurants.length === 1 ? allOn : undefined}
          onSaved={() => router.refresh()}
        />
      )}
    </>
  );
}
