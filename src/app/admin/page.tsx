import Link from "next/link";
import { History, Users } from "lucide-react";
import { MarkAllDeliveredButton } from "@/components/admin/mark-all-delivered-button";
import { OrderingKillSwitch } from "@/components/admin/ordering-kill-switch";
import { OrderList } from "@/components/admin/order-list";
import { RestaurantToggleList } from "@/components/admin/restaurant-toggle-list";
import { StatCards } from "@/components/admin/stat-cards";
import { adminPill } from "@/components/admin/styles";
import { getAdminOrders, getAdminRestaurants, getOrderCounts } from "@/lib/data/admin";
import { formatShortDay, isPastDeliverySlot, startOfTodayIST } from "@/lib/date";
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
        todayLabel={formatShortDay(new Date().toISOString())}
        totalOrders={orderCounts.total}
        confirmedOrders={orderCounts.confirmed}
        completedOrders={orderCounts.completed}
        activeRestaurants={activeRestaurants}
        totalRestaurants={restaurants.length}
      >
        <OrderingKillSwitch initialEnabled={orderingEnabled} />
      </StatCards>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/history" className={adminPill}>
          <History className="size-4" aria-hidden="true" />
          Order history
        </Link>
        <Link href="/admin/users" className={adminPill}>
          <Users className="size-4" aria-hidden="true" />
          Users
        </Link>
      </div>

      <section>
        <h2 className="mb-3 font-heading text-title font-bold">Restaurants</h2>
        <RestaurantToggleList restaurants={restaurants} orderingEnabled={orderingEnabled} />
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-title font-bold">Today&apos;s orders</h2>
          <MarkAllDeliveredButton
            confirmedCount={confirmedOrders.length}
            eligibleCount={eligibleForDelivery}
          />
        </div>
        <OrderList orders={orders} restaurants={restaurants} />
      </section>
    </>
  );
}
