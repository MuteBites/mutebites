import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackToDashboardLink } from "@/components/admin/back-to-dashboard-link";
import { OrderDetailView } from "@/components/admin/order-detail-view";
import { getAdminOrderDetail } from "@/lib/data/admin";
import { getTodaysBatches } from "@/lib/data/delivery";

export const metadata: Metadata = { title: "Order · MuteBites Admin" };

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const [order, batches] = await Promise.all([getAdminOrderDetail(id), getTodaysBatches()]);
  if (!order) notFound();

  return (
    <>
      <BackToDashboardLink />
      <OrderDetailView order={order} batches={batches[order.restaurantId]} />
    </>
  );
}
