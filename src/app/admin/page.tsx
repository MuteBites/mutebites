import { MarkAllDeliveredButton } from "@/components/admin/mark-all-delivered-button";
import { NewOrderAlerts } from "@/components/admin/new-order-alerts";
import { OrderBoard } from "@/components/admin/order-board";
import { OrderingKillSwitch } from "@/components/admin/ordering-kill-switch";
import { RefreshAt } from "@/components/admin/refresh-at";
import { StatCards, TodayTiles } from "@/components/admin/stat-cards";
import {
  getAdminOrders,
  getAdminRestaurants,
  getConfirmedOrderTimes,
  getOrderCounts,
  getToCollect,
} from "@/lib/data/admin";
import { formatShortDay, formatTime, isPastDeliverySlot, slotEndTime, startOfTodayIST } from "@/lib/date";
import { getOffers } from "@/lib/data/offers";
import { getOrderingState } from "@/lib/data/settings";
import { OFFERS } from "@/lib/offers";

/**
 * The admin's Orders tab (mobile-first redesign, 12 Nov 2026): the Today
 * card (slot countdown + Open / Closed), today's numbers, the alert
 * switches, then the live board. Every other admin page, and the
 * restaurant switches, live on the More tab (/admin/more).
 */
export default async function AdminPage() {
  const [restaurants, orderCounts, ordering, orders, confirmedAll, offers, toCollect] = await Promise.all([
    getAdminRestaurants(),
    getOrderCounts(startOfTodayIST()),
    getOrderingState(),
    getAdminOrders(),
    getConfirmedOrderTimes(),
    getOffers(),
    getToCollect(),
  ]);

  const activeRestaurants = restaurants.filter((r) => r.is_active).length;

  // Counted over every confirmed order (not just today's list below) —
  // the same set markAllConfirmedDelivered() acts on.
  const eligibleForDelivery = confirmedAll.filter((o) => isPastDeliverySlot(o.createdAt)).length;
  const waiting = confirmedAll.filter((o) => !isPastDeliverySlot(o.createdAt));
  // When the next finished order's slot ends and it should drop off the board.
  const nextDropOff = orders
    .filter((o) => o.status === "delivered" || o.status === "cancelled")
    .map((o) => slotEndTime(o.createdAt).getTime());
  const nextSlotEnd = waiting.length
    ? formatTime(new Date(Math.min(...waiting.map((o) => slotEndTime(o.createdAt).getTime()))).toISOString())
    : null;
  const openOrders = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");

  return (
    <>
      <StatCards
        todayLabel={formatShortDay(new Date().toISOString())}
        openOrders={openOrders.map((o) => ({ createdAt: o.createdAt }))}
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
        confirmedTools={
          <MarkAllDeliveredButton
            confirmedCount={confirmedAll.length}
            eligibleCount={eligibleForDelivery}
            nextSlotEnd={nextSlotEnd}
          />
        }
      />
      <RefreshAt at={nextDropOff.length ? Math.min(...nextDropOff) : null} />
    </>
  );
}
