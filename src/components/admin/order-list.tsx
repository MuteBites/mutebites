import type { AdminOrder } from "@/lib/data/admin";
import { OrderCard } from "./order-card";

export function OrderList({ orders }: { orders: AdminOrder[] }) {
  if (orders.length === 0) {
    return (
      <p className="rounded-2xl border bg-card p-6 text-center text-muted-foreground">
        No orders yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
