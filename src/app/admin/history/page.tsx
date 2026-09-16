import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OrderList } from "@/components/admin/order-list";
import { getAdminOrderHistory, getAdminRestaurants } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Order history · MuteBites Admin" };

export default async function AdminHistoryPage() {
  const [orders, restaurants] = await Promise.all([getAdminOrderHistory(), getAdminRestaurants()]);

  return (
    <>
      <div>
        <Link
          href="/admin"
          className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight">Order history</h1>
        <p className="mt-1 text-muted-foreground">
          Every order ever placed, grouped by day — the main dashboard only shows today&apos;s.
        </p>
      </div>

      <OrderList orders={orders} restaurants={restaurants} groupByDate />
    </>
  );
}
