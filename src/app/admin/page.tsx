import { MarkAllDeliveredButton } from "@/components/admin/mark-all-delivered-button";
import { NewOrderAlerts } from "@/components/admin/new-order-alerts";
import { OrderBoard } from "@/components/admin/order-board";
import { OrderingKillSwitch } from "@/components/admin/ordering-kill-switch";
import { StatCards, TodayTiles } from "@/components/admin/stat-cards";
import {
  getAdminOrders,
  getAdminRestaurants,
  getConfirmedOrderTimes,
  getOrderCounts,
  getToCollect,
} from "@/lib/data/admin";
import { formatShortDay, formatTime, startOfTodayIST } from "@/lib/date";
import { getDeliveryInfos } from "@/lib/data/delivery";
import { dueSummary, orderDelivery } from "@/lib/delivery";
import { getOffers } from "@/lib/data/offers";
import { getOrderingState } from "@/lib/data/settings";
import { OFFERS } from "@/lib/offers";

/**
 * The admin's Orders tab (mobile-first redesign, 12 Nov 2026): the Today
 * card (next-delivery countdown + Open / Closed), today's numbers, the
 * alert switches, then the live board. Delivery times come from the
 * Delivery tab (lunch is fixed 1:45–2 PM).
 */
export default async function AdminPage() {
  const [restaurants, orderCounts, ordering, orders, confirmedAll, offers, toCollect, delivery] = await Promise.all([
    getAdminRestaurants(),
    getOrderCounts(startOfTodayIST()),
    getOrderingState(),
    getAdminOrders(),
    getConfirmedOrderTimes(),
    getOffers(),
    getToCollect(),
    getDeliveryInfos(),
  ]);

  const activeRestaurants = restaurants.filter((r) => r.is_active).length;

  // When each order is due: lunch 1:45–2 PM, else its restaurant's time
  // for that day (null = not set yet).
  const dueOf = (o: { createdAt: string; restaurantId: string }) =>
    orderDelivery(o.createdAt, delivery[o.restaurantId], o.restaurantId)?.deliverAt ?? null;
  // Counted over every confirmed order (not just today's board) — the same
  // set markAllConfirmedDelivered() acts on: due time already passed.
  const { passed: eligibleForDelivery, next } = dueSummary(confirmedAll.map((o) => dueOf(o)));
  const nextSlotEnd = next === null ? null : formatTime(new Date(next).toISOString());
  const openOrders = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
  const dueById = Object.fromEntries(orders.map((o) => [o.id, dueOf(o)]));

  return (
    <>
      <StatCards
        todayLabel={formatShortDay(new Date().toISOString())}
        openOrders={openOrders.map((o) => ({ due: dueById[o.id] }))}
        activeRestaurants={activeRestaurants}
        totalRestaurants={restaurants.length}
        offersOn={offers.active.map((k) => OFFERS[k].short)}
      >
        <OrderingKillSwitch ordering={ordering} />
      </StatCards>

      <TodayTiles
        total={orderCounts.total}
        delivered={orderCounts.completed}
        cancelled={orderCounts.cancelled}
        toCollect={toCollect}
      />

      <NewOrderAlerts />

      <OrderBoard
        orders={orders}
        dueById={dueById}
        confirmedTools={
          <MarkAllDeliveredButton
            confirmedCount={confirmedAll.length}
            eligibleCount={eligibleForDelivery}
            nextSlotEnd={nextSlotEnd}
          />
        }
      />
    </>
  );
}
