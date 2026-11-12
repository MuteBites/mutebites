import type { Metadata } from "next";
import { KitchenView } from "@/components/admin/kitchen-view";
import { RestaurantToggleList } from "@/components/admin/restaurant-toggle-list";
import { getAdminOrders, getAdminRestaurants } from "@/lib/data/admin";
import { getOrderingState } from "@/lib/data/settings";
import { getTodaysBatches } from "@/lib/data/delivery";

export const metadata: Metadata = { title: "Kitchen · MuteBites Admin" };

/**
 * The admin's Kitchen tab: the restaurant on / off switches first (moved
 * here from More, 12 Nov 2026 — the client's call), then what to tell
 * each restaurant, per delivery slot.
 */
export default async function AdminKitchenPage() {
  const [orders, restaurants, ordering, delivery] = await Promise.all([
    getAdminOrders(),
    getAdminRestaurants(),
    getOrderingState(),
    getTodaysBatches(),
  ]);
  // Oldest first, so tokens and lists read in the order they came in.
  const open = [...orders].reverse();

  return (
    <>
      <h1 className="font-heading text-headline font-bold">Kitchen</h1>
      <section aria-labelledby="restaurants-heading">
        <h2 id="restaurants-heading" className="mb-3 font-heading text-title font-bold">
          Restaurants
        </h2>
        <RestaurantToggleList
          restaurants={restaurants}
          orderingEnabled={ordering.open}
          forcedClosed={ordering.mode === "closed"}
          closedChip={ordering.short}
          batches={delivery}
        />
      </section>
      <h2 className="-mb-2 font-heading text-title font-bold">What to cook</h2>
      <KitchenView
        confirmed={open.filter((o) => o.status === "confirmed" || o.status === "preparing" || o.status === "out_for_delivery")}
        pending={open.filter((o) => o.status === "pending")}
      />
    </>
  );
}
