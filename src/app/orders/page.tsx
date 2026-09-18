import type { Metadata } from "next";
import Link from "next/link";
import { ViewTransition } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { TabBar } from "@/components/nav/tab-bar";
import { getOrderHistory, type OrderSummary } from "@/lib/data/orders";
import { formatOrderTimestamp } from "@/lib/date";
import { formatRupees } from "@/lib/format";
import { NAV_TRANSITION, REVEAL_ENTER } from "@/lib/nav-transition";
import { formatOrderNumber, isActiveStatus, statusBadge } from "@/lib/orders/status";
import { requireProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Your orders · MuteBites" };

export default async function OrdersPage() {
  const profile = await requireProfile();
  const orders = await getOrderHistory(profile.id);

  return (
    <main className="mx-auto w-full max-w-md px-6 pt-6 pb-28">
      <ViewTransition {...NAV_TRANSITION}>
        <ViewTransition {...REVEAL_ENTER}>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Your orders</h1>
          <p className="mt-1 text-muted-foreground">
            {orders.length === 0
              ? "No orders yet"
              : `${orders.length} ${orders.length === 1 ? "order" : "orders"} · all handed over at the gate`}
          </p>

          {orders.length === 0 ? (
            <EmptyOrders />
          ) : (
            <ul className="mt-6 flex flex-col gap-4">
              {orders.map((order) => (
                <li key={order.id}>
                  <OrderCard order={order} />
                </li>
              ))}
            </ul>
          )}
        </ViewTransition>
      </ViewTransition>

      <TabBar />
    </main>
  );
}

function EmptyOrders() {
  return (
    <div className="flex flex-col items-center pt-16 pb-6 text-center">
      <BrandLogo className="size-24 animate-bounce-idle" />
      <p className="mt-6 font-heading text-2xl font-bold">No orders yet</p>
      <p className="mt-2 text-muted-foreground">Your first order shows up right here, start to finish.</p>
      <Link
        href="/"
        className="pressable mt-6 flex h-14 items-center rounded-2xl bg-primary px-8 font-heading text-lg font-bold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        Order something
      </Link>
    </div>
  );
}

function OrderCard({ order }: { order: OrderSummary }) {
  const badge = statusBadge(order.status);
  const active = isActiveStatus(order.status);

  return (
    <div className={cn("rounded-3xl border bg-card shadow-card p-5", active && "border-primary/40")}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-heading text-lg font-bold">{order.restaurantName}</h2>
        <span
          className={cn(
            "shrink-0 rounded-full px-3 py-1 text-xs font-bold tracking-wide whitespace-nowrap",
            badge.className,
          )}
        >
          {badge.label}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatOrderTimestamp(order.createdAt)} · {formatOrderNumber(order.dailyNumber)}
      </p>
      <p className="mt-0.5 text-sm font-bold text-primary">{order.itemsSummary}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="font-heading text-xl font-bold">{formatRupees(order.totalAmount)}</p>
        {active ? (
          <Link
            href={`/orders/${order.id}`}
            transitionTypes={["nav-forward"]}
            className="pressable flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            Track order <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        ) : order.status === "delivered" ? (
          <Link
            href={`/restaurants/${order.restaurantId}`}
            transitionTypes={["nav-forward"]}
            className="pressable flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-brand-soft-foreground/20 bg-brand-soft px-4 text-sm font-bold text-brand-soft-foreground outline-none hover:bg-brand-soft/70 focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <RotateCcw className="size-4" aria-hidden="true" /> Reorder
          </Link>
        ) : (
          <Link
            href={`/orders/${order.id}`}
            transitionTypes={["nav-forward"]}
            className="pressable flex h-10 shrink-0 items-center rounded-full border bg-secondary px-4 text-sm font-bold text-muted-foreground outline-none hover:bg-border focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            View details
          </Link>
        )}
      </div>
    </div>
  );
}
