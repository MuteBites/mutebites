import Link from "next/link";
import { History, Users } from "lucide-react";
import { MarkAllDeliveredButton } from "@/components/admin/mark-all-delivered-button";
import { OrderingKillSwitch } from "@/components/admin/ordering-kill-switch";
import { OrderList } from "@/components/admin/order-list";
import { RestaurantToggleList } from "@/components/admin/restaurant-toggle-list";
import { StatCards } from "@/components/admin/stat-cards";
import { getAdminOrders, getAdminRestaurants, getOrderCounts } from "@/lib/data/admin";
import { isPastDeliverySlot, startOfTodayIST } from "@/lib/date";
import { getOrderingEnabled } from "@/lib/data/settings";

export default async function AdminPage() {
  const [restaurants, orderCounts, orderingEnabled, orders] = await Promise.all([
    getAdminRestaurants(),
    getOrderCounts(startOfTodayIST()),
    getOrderingEnabled(),
    getAdminOrders(),
  ]);

  const activeRestaurants = restaurants.filter((r) => r.is_active).length;

  const confirmedOrders = orders.filter((o) => o.status === "confirmed");
  const eligibleForDelivery = confirmedOrders.filter((o) => isPastDeliverySlot(o.createdAt)).length;

  return (
    <>
      <StatCards
        totalOrders={orderCounts.total}
        confirmedOrders={orderCounts.confirmed}
        completedOrders={orderCounts.completed}
        activeRestaurants={activeRestaurants}
        totalRestaurants={restaurants.length}
        orderingEnabled={orderingEnabled}
      />

      <OrderingKillSwitch initialEnabled={orderingEnabled} />

      <section>
        <h2 className="mb-3 font-mono text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
          Restaurant controls
        </h2>
        <RestaurantToggleList restaurants={restaurants} orderingEnabled={orderingEnabled} />
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-mono text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
            Orders · Today
          </h2>
          <div className="flex items-center gap-2">
            <MarkAllDeliveredButton
              confirmedCount={confirmedOrders.length}
              eligibleCount={eligibleForDelivery}
            />
            <Link
              href="/admin/history"
              className="flex h-9 items-center gap-1.5 rounded-xl border bg-card px-3 text-sm font-semibold outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <History className="size-3.5" />
              Order history
            </Link>
            <Link
              href="/admin/users"
              className="flex h-9 items-center gap-1.5 rounded-xl border bg-card px-3 text-sm font-semibold outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <Users className="size-3.5" />
              Users
            </Link>
          </div>
        </div>
        <OrderList orders={orders} restaurants={restaurants} />
      </section>
    </>
  );
}
