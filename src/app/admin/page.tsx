import Link from "next/link";
import { History, Users } from "lucide-react";
import { MarkAllDeliveredButton } from "@/components/admin/mark-all-delivered-button";
import { OrderingKillSwitch } from "@/components/admin/ordering-kill-switch";
import { OrderList } from "@/components/admin/order-list";
import { RestaurantToggleList } from "@/components/admin/restaurant-toggle-list";
import { StatCards } from "@/components/admin/stat-cards";
import { adminPill } from "@/components/admin/styles";
import { getAdminOrders, getAdminRestaurants, getConfirmedOrderTimes, getOrderCounts } from "@/lib/data/admin";
import { formatShortDay, formatTime, isPastDeliverySlot, slotEndTime, startOfTodayIST } from "@/lib/date";
import { getOrderingEnabled } from "@/lib/data/settings";

export default async function AdminPage() {
  const [restaurants, orderCounts, orderingEnabled, orders, confirmedAll] = await Promise.all([
    getAdminRestaurants(),
    getOrderCounts(startOfTodayIST()),
    getOrderingEnabled(),
    getAdminOrders(),
    getConfirmedOrderTimes(),
  ]);

  const activeRestaurants = restaurants.filter((r) => r.is_active).length;

  // Counted over every confirmed order (not just today's list below) —
  // the same set markAllConfirmedDelivered() acts on.
  const eligibleForDelivery = confirmedAll.filter((o) => isPastDeliverySlot(o.createdAt)).length;
  const waiting = confirmedAll.filter((o) => !isPastDeliverySlot(o.createdAt));
  const nextSlotEnd = waiting.length
    ? formatTime(new Date(Math.min(...waiting.map((o) => slotEndTime(o.createdAt).getTime()))).toISOString())
    : null;

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
            confirmedCount={confirmedAll.length}
            eligibleCount={eligibleForDelivery}
            nextSlotEnd={nextSlotEnd}
          />
        </div>
        <OrderList orders={orders} restaurants={restaurants} />
      </section>
    </>
  );
}
