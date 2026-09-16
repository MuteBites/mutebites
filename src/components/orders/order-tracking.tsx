"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ViewTransition } from "react";
import {
  ArrowLeft,
  Check,
  ChefHat,
  CookingPot,
  Phone,
  Receipt,
  Share2,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { ConfettiBurst } from "@/components/orders/confetti-burst";
import type { OrderDetail } from "@/lib/data/orders";
import type { OrderStatus } from "@/lib/data/types";
import { estimatedDelivery, formatTime } from "@/lib/date";
import { formatRupees } from "@/lib/format";
import { NAV_TRANSITION } from "@/lib/nav-transition";
import { formatOrderNumber, orderTimeline, type TimelineStepState } from "@/lib/orders/status";
import { playOrderPlacedSound } from "@/lib/sound/play";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

/** Native share sheet when available (mostly mobile); clipboard copy otherwise. */
async function shareOrderToken(token: string) {
  const text = `My MuteBites order token: ${token}`;
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch {
      // Cancelled, or unsupported despite the feature check — fall through to copying.
    }
  }
  try {
    await navigator.clipboard.writeText(token);
    toast.success("Token copied!");
  } catch {
    toast.error("Couldn't copy — try selecting it manually.");
  }
}

// Confetti plays once ever, on whichever order happens to be the first
// this device sees placed — remembered locally, not tied to the account,
// so it survives across restaurants/orders but not across devices.
const CONFETTI_SHOWN_KEY = "mutebites.confetti-shown";

// One icon per row of orderTimeline() (order/status.ts), by position —
// "Order placed", "Restaurant confirmed", "Preparing & out for delivery".
const STEP_ICONS: LucideIcon[] = [Receipt, ChefHat, CookingPot];

/**
 * Renders the tracking page and keeps `status`/`updatedAt` live via
 * Supabase Realtime (subscribed to just this order's row — RLS still
 * governs whether this client is even allowed to receive it). Everything
 * else about the order (items, restaurant, total) never changes after
 * placement, so only these two fields need to be reactive.
 *
 * Falls back cleanly if Realtime never connects or the tab was in the
 * background: `initialOrder` came from the server component's own fetch,
 * so a plain page refresh always shows the true current status regardless
 * of whether the socket ever came up — the "Live" indicator is a bonus,
 * not something anything else here depends on.
 */
export function OrderTracking({
  initialOrder,
  justPlaced = false,
}: {
  initialOrder: OrderDetail;
  /** True once, right after this order was placed — shows a brief success moment. */
  justPlaced?: boolean;
}) {
  const router = useRouter();
  // Captured once, on mount — not the live `justPlaced` prop. The effect
  // below calls router.replace() to strip ?placed=1, which (this route
  // reads searchParams, so it's dynamically rendered) triggers a fresh
  // server render with justPlaced now false. If the effect depended on
  // the live prop instead, that re-render would tear down its cleanup —
  // cancelling the still-pending "out"/"hidden" timers below — and the
  // re-run would immediately bail out without rescheduling them, leaving
  // the success overlay stuck open until manually tapped.
  const [showSuccess] = useState(justPlaced);
  const [status, setStatus] = useState(initialOrder.status);
  const [updatedAt, setUpdatedAt] = useState(initialOrder.updatedAt);
  const [live, setLive] = useState(false);
  const [successPhase, setSuccessPhase] = useState<"in" | "out" | "hidden">(
    showSuccess ? "in" : "hidden",
  );
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!showSuccess) return;
    // Strip ?placed=1 right away so a refresh doesn't replay the moment.
    router.replace(`/orders/${initialOrder.id}`);
    playOrderPlacedSound();
    // Deferred a tick (not called synchronously in the effect body) so this
    // one-time browser-only check doesn't trigger a same-render setState.
    const toConfetti = setTimeout(() => {
      try {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!reducedMotion && !localStorage.getItem(CONFETTI_SHOWN_KEY)) {
          localStorage.setItem(CONFETTI_SHOWN_KEY, "1");
          setShowConfetti(true);
        }
      } catch {
        // Storage unavailable (private mode) — skip the confetti, the rest of the success moment still shows.
      }
    }, 0);
    const toOut = setTimeout(() => setSuccessPhase("out"), 1800);
    const toHidden = setTimeout(() => setSuccessPhase("hidden"), 2020);
    return () => {
      clearTimeout(toConfetti);
      clearTimeout(toOut);
      clearTimeout(toHidden);
    };
  }, [initialOrder.id, showSuccess, router]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`order-${initialOrder.id}`)
      .on<{ status: OrderStatus; updated_at: string }>(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${initialOrder.id}` },
        (payload) => {
          setStatus(payload.new.status);
          setUpdatedAt(payload.new.updated_at);
        },
      )
      .subscribe((subscribeStatus) => setLive(subscribeStatus === "SUBSCRIBED"));

    return () => {
      setLive(false);
      supabase.removeChannel(channel);
    };
  }, [initialOrder.id]);

  const cancelled = status === "cancelled";
  const steps = cancelled ? [] : orderTimeline(status);

  return (
    <>
      {successPhase !== "hidden" && (
        <div
          role="status"
          onClick={() => setSuccessPhase("hidden")}
          className={cn(
            "fixed inset-0 z-[90] flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-ink px-6 text-center text-ink-foreground",
            successPhase === "out" ? "animate-overlay-out" : "animate-overlay-in",
          )}
        >
          <span
            aria-hidden="true"
            className="animate-ping-slow pointer-events-none absolute size-56 rounded-full bg-primary/25 blur-3xl"
          />
          {showConfetti && <ConfettiBurst />}
          <BrandLogo className="animate-pop-in size-20 bg-ink-foreground/10" />
          <p className="animate-pop-in mt-5 font-heading text-2xl font-bold">Order placed!</p>
          <p className="mt-1 text-ink-foreground/70">Show this token at the gate</p>
          <p className="animate-pop-in mt-4 font-heading text-7xl font-bold tracking-tight text-primary">
            {formatOrderNumber(initialOrder.dailyNumber)}
          </p>
          <p className="mt-6 text-sm text-ink-foreground/50">Tap to continue</p>
        </div>
      )}
      <main className="mx-auto w-full max-w-md px-6 pb-12">
        <ViewTransition {...NAV_TRANSITION}>
          <div className="flex items-center gap-3 pt-4 pb-2">
            <Link
              href="/orders"
              aria-label="Back to your orders"
              transitionTypes={["nav-back"]}
              className="flex size-11 items-center justify-center rounded-full bg-secondary outline-none hover:bg-border focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <ArrowLeft className="size-5" />
            </Link>
          </div>

          <div className="surface-ink shadow-elevated-glow rounded-3xl bg-ink p-6 text-ink-foreground">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm opacity-70">Order placed · {formatTime(initialOrder.createdAt)}</p>
              {live && (
                <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-success">
                  <span className="size-4 animate-pulse rounded-full bg-success" aria-hidden="true" />
                  Live
                </span>
              )}
            </div>
            {!cancelled && (
              <div className="mt-4 flex items-start justify-between gap-2">
                <p className="font-mono text-xs font-semibold tracking-[0.1em] text-primary uppercase">
                  Show this token
                </p>
                <p className="max-w-[9rem] shrink-0 text-right text-sm font-bold text-ink-foreground/90">
                  {estimatedDelivery(initialOrder.createdAt)}
                </p>
              </div>
            )}
            <div className={cn("flex items-center gap-2", cancelled ? "mt-4" : "mt-1")}>
              <p className="font-heading text-4xl font-bold tracking-tight">
                {formatOrderNumber(initialOrder.dailyNumber)}
              </p>
              <button
                type="button"
                onClick={() => shareOrderToken(formatOrderNumber(initialOrder.dailyNumber))}
                aria-label="Share order token"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 outline-none hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
              >
                <Share2 className="size-4" />
              </button>
            </div>
            <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm">
              <span aria-hidden="true">📍</span> Collect at VIT-AP Main Gate
            </p>
          </div>

          {cancelled ? (
            <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4">
              <p className="font-heading text-lg font-bold text-destructive">Order cancelled</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This order won&apos;t be delivered. If you were charged or have questions, call
                MuteBites.
              </p>
            </div>
          ) : (
            <ol className="mt-6 flex flex-col">
              {steps.map((step, i) => (
                <li key={step.label} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <StepDot state={step.state} Icon={STEP_ICONS[i] ?? Check} />
                    {i < steps.length - 1 && (
                      <span
                        className={cn("w-0.5 flex-1", step.state === "done" ? "bg-success" : "bg-border")}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className={cn("pb-6", step.state === "upcoming" && "opacity-50")}>
                    <p className={cn("font-semibold", step.state === "current" && "text-primary")}>
                      {step.label}
                      {step.state === "current" && " (pending)"}
                    </p>
                    {i === 0 && <p className="text-sm text-muted-foreground">{formatTime(initialOrder.createdAt)}</p>}
                    {step.state === "current" && step.label.startsWith("Preparing") && (
                      <p className="text-sm text-muted-foreground">We&apos;ll call you when we reach the gate.</p>
                    )}
                    {i === steps.length - 1 && step.state === "done" && (
                      <p className="text-sm text-muted-foreground">{formatTime(updatedAt)}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}

          <div className="mt-2 rounded-2xl border bg-card p-5">
            <p className="font-mono text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              {initialOrder.restaurantName}
            </p>
            <ul className="mt-3 divide-y">
              {initialOrder.items.map((item) => (
                <li key={item.dishName} className="flex justify-between py-2 text-sm">
                  <span>
                    {item.quantity} × {item.dishName}
                  </span>
                  <span className="tabular-nums">{formatRupees(item.subtotal)}</span>
                </li>
              ))}
            </ul>
            {initialOrder.notes && (
              <p className="mt-3 rounded-xl bg-secondary px-4 py-2.5 text-sm text-muted-foreground">
                “{initialOrder.notes}”
              </p>
            )}
            <div className="mt-3 flex items-center justify-between border-t pt-3">
              <p className="font-semibold">Pay in cash</p>
              <p className="font-heading text-xl font-bold tabular-nums">{formatRupees(initialOrder.totalAmount)}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl border bg-card px-5 py-4">
            <div>
              <p className="text-sm text-muted-foreground">Something wrong?</p>
              <p className="font-semibold">Call MuteBites</p>
            </div>
            <a
              href={`tel:${initialOrder.restaurantPhone}`}
              className="flex h-11 items-center gap-2 rounded-xl bg-ink px-4 font-semibold text-ink-foreground outline-none hover:bg-ink/90 focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <Phone className="size-4" /> Call
            </a>
          </div>
        </ViewTransition>
      </main>
    </>
  );
}

function StepDot({ state, Icon }: { state: TimelineStepState; Icon: LucideIcon }) {
  if (state === "done") {
    return (
      <span className="animate-pop-in flex size-9 shrink-0 items-center justify-center rounded-full bg-success text-white">
        <Check className="size-4" />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className="relative flex size-9 shrink-0 items-center justify-center" aria-hidden="true">
        <span className="animate-ping-slow absolute inset-0 rounded-full bg-primary/50" />
        <span className="relative flex size-9 items-center justify-center rounded-full bg-primary text-white">
          <Icon className="size-4" />
        </span>
      </span>
    );
  }
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-border text-muted-foreground">
      <Icon className="size-4" />
    </span>
  );
}
