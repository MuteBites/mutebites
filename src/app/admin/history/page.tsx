import type { Metadata } from "next";
import { BackToDashboardLink } from "@/components/admin/back-to-dashboard-link";
import { OrderList } from "@/components/admin/order-list";
import { getAdminOrderHistory, getAdminRestaurants } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Order history · MuteBites Admin" };

/** ?open=1 (the Orders tab's "To collect" tile): only orders not delivered or cancelled yet, any day. */
export default async function AdminHistoryPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  const open = (await searchParams).open === "1";
  const [all, restaurants] = await Promise.all([getAdminOrderHistory(), getAdminRestaurants()]);
  const orders = open ? all.filter((o) => o.status !== "delivered" && o.status !== "cancelled") : all;

  return (
    <>
      <div>
        {open ? (
          <BackToDashboardLink label="Back to orders" />
        ) : (
          <BackToDashboardLink href="/admin/more" label="Back to More" />
        )}
        <h1 className="mt-4 font-heading text-headline font-bold">{open ? "To collect" : "Order history"}</h1>
        <p className="mt-1 text-muted-foreground">
          {open
            ? "Every order not delivered or cancelled yet, any day. Confirm, mark delivered or cancel each one."
            : "Every order ever placed, grouped by day — the dashboard only shows current ones. Tap an order for its full details."}
        </p>
      </div>

      <OrderList orders={orders} restaurants={restaurants} groupByDate />
    </>
  );
}
