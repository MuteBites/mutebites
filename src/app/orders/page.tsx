import type { Metadata } from "next";
import Link from "next/link";
import { TabBar } from "@/components/nav/tab-bar";
import { getOrderHistory, type OrderSummary } from "@/lib/data/orders";
import { formatOrderTimestamp } from "@/lib/date";
import { formatRupees } from "@/lib/format";
import { isActiveStatus, orderReference, statusBadge } from "@/lib/orders/status";
import { requireProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Your orders · MuteBites" };

export default async function OrdersPage() {
  const profile = await requireProfile();
  const orders = await getOrderHistory(profile.id);

  return (
    <main className="mx-auto w-full max-w-md px-6 pt-6 pb-28">
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

      <TabBar />
    </main>
  );
}

function EmptyOrders() {
  return (
    <div className="flex flex-col items-center pt-16 pb-6 text-center">
      <div className="flex size-24 items-center justify-center rounded-3xl border border-dashed border-primary/30 bg-brand-soft">
        <span className="font-heading text-sm font-semibold tracking-wide text-muted-foreground uppercase" aria-hidden="true">
          Empty
        </span>
      </div>
      <p className="mt-6 font-heading text-2xl font-bold">No orders yet</p>
      <p className="mt-2 text-muted-foreground">Your first order shows up here with its status and total.</p>
      <Link
        href="/"
        className="mt-6 flex h-14 items-center rounded-2xl bg-primary px-8 font-heading text-lg font-bold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/40"
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
    <div className={cn("rounded-3xl border bg-card p-5", active && "border-primary/40")}>
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
        {formatOrderTimestamp(order.createdAt)} · {order.itemCount} {order.itemCount === 1 ? "item" : "items"} ·{" "}
        {orderReference(order.id)}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <p className="font-heading text-xl font-bold">{formatRupees(order.totalAmount)}</p>
        {active ? (
          <Link href={`/orders/${order.id}`} className="font-semibold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40">
            Track order →
          </Link>
        ) : order.status === "delivered" ? (
          <Link
            href={`/restaurants/${order.restaurantId}`}
            className="font-semibold text-muted-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            Reorder
          </Link>
        ) : (
          <Link
            href={`/orders/${order.id}`}
            className="font-semibold text-muted-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            View details
          </Link>
        )}
      </div>
    </div>
  );
}
