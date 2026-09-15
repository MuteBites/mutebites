import { BannedUsersSection } from "@/components/admin/banned-users-section";
import { MarkAllDeliveredButton } from "@/components/admin/mark-all-delivered-button";
import { OrderingKillSwitch } from "@/components/admin/ordering-kill-switch";
import { OrderList } from "@/components/admin/order-list";
import { RestaurantToggleList } from "@/components/admin/restaurant-toggle-list";
import { StatCards } from "@/components/admin/stat-cards";
import { getAdminOrders, getAdminRestaurants, getBannedUsers, getOrderCounts } from "@/lib/data/admin";
import { isPastDeliverySlot } from "@/lib/date";
import { getOrderingEnabled } from "@/lib/data/settings";

export default async function AdminPage() {
  const [restaurants, orderCounts, orderingEnabled, orders, bannedUsers] = await Promise.all([
    getAdminRestaurants(),
    getOrderCounts(),
    getOrderingEnabled(),
    getAdminOrders(),
    getBannedUsers(),
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
        <RestaurantToggleList restaurants={restaurants} />
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-mono text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
            Orders
          </h2>
          <MarkAllDeliveredButton
            confirmedCount={confirmedOrders.length}
            eligibleCount={eligibleForDelivery}
          />
        </div>
        <OrderList orders={orders} restaurants={restaurants} />
      </section>

      <section>
        <h2 className="mb-3 font-mono text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
          Banned users
        </h2>
        <BannedUsersSection bannedUsers={bannedUsers} />
      </section>
    </>
  );
}
