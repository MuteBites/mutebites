"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, MessageSquareText, Phone, Truck } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { clearDeliveryInfo, delayDelivery } from "@/lib/admin/delivery-actions";
import type { AdminRestaurant } from "@/lib/data/admin";
import { formatTime } from "@/lib/date";
import { deliveryLine, isSetToday, LUNCH_WINDOW, type DeliveryInfo } from "@/lib/delivery";
import { formatStoredMobile } from "@/lib/phone";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";
import { DeliveryDialog } from "./delivery-dialog";

type Target = { restaurants: { id: string; name: string }[]; current?: DeliveryInfo | null } | null;

/**
 * The admin's Delivery tab (12 Nov 2026, it replaced Handover): each
 * restaurant's delivery time for today — an exact time or "within N min",
 * an optional message and the delivery person's phone — which is what
 * students see on their ticket. Only restaurants that are on are listed;
 * after 12:45 PM one with no time today can't take orders (no fallback,
 * by decision).
 */
export function DeliveryView({
  restaurants,
  delivery,
}: {
  restaurants: AdminRestaurant[];
  delivery: Record<string, DeliveryInfo>;
}) {
  const router = useRouter();
  const [target, setTarget] = useState<Target>(null);
  const [clearing, startClear] = useTransition();
  // Only restaurants that are on (Kitchen) — the client's call, 12 Nov
  // 2026. A switched-off one gets its time when it's turned on.
  const on = restaurants.filter((r) => r.is_active);
  const allOn = on.map(({ id, name }) => ({ id, name }));
  const missing = on.filter((r) => !isSetToday(delivery[r.id]));

  function clear(r: AdminRestaurant) {
    startClear(async () => {
      const result = await clearDeliveryInfo(r.id);
      if (result.ok) {
        toast.success(`${r.name}'s delivery time is cleared.`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function delay(r: AdminRestaurant, minutes: number) {
    startClear(async () => {
      const result = await delayDelivery(r.id, minutes);
      if (result.ok) {
        toast.success(
          `${r.name}: pushed back ${minutes} min.${
            result.notified ? ` ${result.notified} ${result.notified === 1 ? "student" : "students"} told.` : ""
          }`,
        );
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function card(r: AdminRestaurant) {
    const info = isSetToday(delivery[r.id]) ? delivery[r.id] : null;
    const line = info ? deliveryLine(info) : null;
    return (
      <li key={r.id}>
        <article className={cn("rounded-3xl border bg-card p-4 shadow-card", !info && r.is_active && "border-destructive/40")}>
          <header className="flex items-center justify-between gap-3">
            <h3 className="min-w-0 truncate font-heading text-lg font-bold">{r.name}</h3>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold",
                r.is_active ? "bg-success-soft text-success" : "bg-secondary text-muted-foreground",
              )}
            >
              {r.is_active ? "On" : "Off"}
            </span>
          </header>
          {info && line ? (
            <ul className="mt-2 flex flex-col gap-1.5 text-sm">
              <li className="flex items-center gap-2">
                <Clock className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="font-semibold">
                  {line.lead} {line.time}
                </span>
                {info.mode === "within" && (
                  <span className="text-muted-foreground">(within {info.withinMinutes} min)</span>
                )}
              </li>
              {info.note && (
                <li className="flex items-start gap-2">
                  <MessageSquareText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span>{info.note}</span>
                </li>
              )}
              {info.riderPhone && (
                <li className="flex items-center gap-2">
                  <Phone className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="tabular-nums">{formatStoredMobile(info.riderPhone)}</span>
                </li>
              )}
              <li className="text-xs text-muted-foreground">Set at {formatTime(info.updatedAt)}</li>
            </ul>
          ) : (
            <p className={cn("mt-2 text-sm", r.is_active ? "font-semibold text-destructive" : "text-muted-foreground")}>
              {r.is_active
                ? "No evening time today — after 12:45 PM students can't order until you set one."
                : "No delivery time today."}
            </p>
          )}
          {info && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">Late?</span>
              {[15, 30].map((m) => (
                <button
                  key={m}
                  type="button"
                  disabled={clearing}
                  onClick={() => delay(r, m)}
                  className="h-9 rounded-full bg-amber-soft px-3.5 text-sm font-bold text-amber-soft-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/80 disabled:opacity-60"
                >
                  +{m} min
                </button>
              ))}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setTarget({ restaurants: [{ id: r.id, name: r.name }], current: delivery[r.id] })}
              className="surface-primary flex h-10 flex-1 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
            >
              {info ? "Change" : "Set delivery time"}
            </button>
            {info && (
              <button
                type="button"
                disabled={clearing}
                onClick={() => clear(r)}
                className="h-10 rounded-full border px-4 text-sm font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/80"
              >
                Clear
              </button>
            )}
          </div>
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
            <h2 className="font-heading text-title font-bold">Today&apos;s deliveries</h2>
            <p className="text-sm text-hero-foreground/85">
              Lunch orders (before 12:45 PM) are always delivered {LUNCH_WINDOW}. Set the evening and night times
              here.
            </p>
            <p className="mt-1 text-sm font-semibold">
              {on.length === 0
                ? "No restaurant is on right now."
                : missing.length === 0
                  ? "Every restaurant that's on has a delivery time."
                  : `${missing.length} ${missing.length === 1 ? "restaurant that's on has" : "restaurants that are on have"} no time yet.`}
            </p>
          </div>
        </div>
        {on.length > 1 && (
          <button
            type="button"
            onClick={() => setTarget({ restaurants: allOn })}
            className="mt-3 h-10 w-full rounded-full bg-hero-foreground/12 text-sm font-semibold text-hero-foreground rim-light outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
          >
            Set one time for all {on.length} that are on
          </button>
        )}
      </section>

      {on.length === 0 ? (
        <EmptyState icon={Truck} title="No restaurant is on" compact>
          Turn one on in Kitchen — it asks for its delivery time then.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">{on.map(card)}</ul>
      )}

      {target && (
        <DeliveryDialog
          key={target.restaurants.map((r) => r.id).join()}
          open
          onOpenChange={(open) => !open && setTarget(null)}
          restaurants={target.restaurants}
          current={target.current}
          allOn={target.restaurants.length === 1 && target.restaurants.some((r) => allOn.some((a) => a.id === r.id)) ? allOn : undefined}
          onSaved={() => router.refresh()}
        />
      )}
    </>
  );
}
