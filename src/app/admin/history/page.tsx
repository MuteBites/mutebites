import type { Metadata } from "next";
import { BackToDashboardLink } from "@/components/admin/back-to-dashboard-link";
import { OrderList } from "@/components/admin/order-list";
import { getAdminOrderHistory, getAdminRestaurants } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Order history · MuteBites Admin" };

export default async function AdminHistoryPage() {
  const [orders, restaurants] = await Promise.all([getAdminOrderHistory(), getAdminRestaurants()]);

  return (
    <>
      <div>
        <BackToDashboardLink />
        <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight">Order history</h1>
        <p className="mt-1 text-muted-foreground">
          Every order ever placed, grouped by day — the main dashboard only shows today&apos;s.
        </p>
      </div>

      <OrderList orders={orders} restaurants={restaurants} groupByDate />
    </>
  );
}
