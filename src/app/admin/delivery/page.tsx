import type { Metadata } from "next";
import { DeliveryView } from "@/components/admin/delivery-view";
import { getAdminOrders, getAdminRestaurants } from "@/lib/data/admin";
import { getTodaysBatches } from "@/lib/data/delivery";

export const metadata: Metadata = { title: "Delivery · MuteBites Admin" };

/** The admin's Delivery tab: today's delivery batches per restaurant that's on. */
export default async function AdminDeliveryPage() {
  const [restaurants, batches, orders] = await Promise.all([getAdminRestaurants(), getTodaysBatches(), getAdminOrders()]);
  const openByBatch: Record<string, number> = {};
  for (const o of orders) {
    if (o.batchId && o.status !== "delivered" && o.status !== "cancelled") openByBatch[o.batchId] = (openByBatch[o.batchId] ?? 0) + 1;
  }
  return (
    <>
      <h1 className="font-heading text-headline font-bold">Delivery</h1>
      <DeliveryView restaurants={restaurants} batches={batches} openByBatch={openByBatch} />
    </>
  );
}
