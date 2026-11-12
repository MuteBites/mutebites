import type { Metadata } from "next";
import { DeliveryView } from "@/components/admin/delivery-view";
import { getAdminRestaurants } from "@/lib/data/admin";
import { getDeliveryInfos } from "@/lib/data/delivery";

export const metadata: Metadata = { title: "Delivery · MuteBites Admin" };

/** The admin's Delivery tab: each restaurant's delivery time, message and rider phone for today. */
export default async function AdminDeliveryPage() {
  const [restaurants, delivery] = await Promise.all([getAdminRestaurants(), getDeliveryInfos()]);
  return (
    <>
      <h1 className="font-heading text-headline font-bold">Delivery</h1>
      <DeliveryView restaurants={restaurants} delivery={delivery} />
    </>
  );
}
