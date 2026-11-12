import type { Metadata } from "next";
import { KitchenView } from "@/components/admin/kitchen-view";
import { getAdminOrders } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Kitchen · MuteBites Admin" };

/** The admin's Kitchen tab: what to tell each restaurant, per delivery slot. */
export default async function AdminKitchenPage() {
  const orders = await getAdminOrders();
  // Oldest first, so tokens and lists read in the order they came in.
  const open = [...orders].reverse();

  return (
    <>
      <h1 className="font-heading text-headline font-bold">Kitchen</h1>
      <KitchenView
        confirmed={open.filter((o) => o.status === "confirmed" || o.status === "preparing" || o.status === "out_for_delivery")}
        pending={open.filter((o) => o.status === "pending")}
      />
    </>
  );
}
