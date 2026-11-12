import type { Metadata } from "next";
import { HandoverView } from "@/components/admin/handover-view";
import { getAdminOrders, getCollectedToday } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Handover · MuteBites Admin" };

/** The admin's Handover tab: today's confirmed orders by token, for the Main Gate. */
export default async function AdminHandoverPage() {
  const [orders, collected] = await Promise.all([getAdminOrders(), getCollectedToday()]);
  const ready = orders
    .filter((o) => o.status === "confirmed" || o.status === "preparing" || o.status === "out_for_delivery")
    .sort((a, b) => a.dailyNumber - b.dailyNumber);

  return (
    <>
      <h1 className="font-heading text-headline font-bold">Handover</h1>
      <HandoverView orders={ready} collected={collected} />
    </>
  );
}
