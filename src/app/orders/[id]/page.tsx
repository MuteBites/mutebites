import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderTracking } from "@/components/orders/order-tracking";
import { getOrder } from "@/lib/data/orders";
import { orderReference } from "@/lib/orders/status";
import { requireProfile } from "@/lib/profile";

export async function generateMetadata({ params }: PageProps<"/orders/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: `Order ${orderReference(id)} · MuteBites` };
}

export default async function OrderDetailPage({ params }: PageProps<"/orders/[id]">) {
  const profile = await requireProfile();
  const { id } = await params;
  const order = await getOrder(id, profile.id);
  if (!order) notFound();

  // OrderTracking takes it from here — this initial fetch is also what a
  // plain page refresh re-runs, so that always works as a fallback
  // regardless of whether the Realtime subscription it sets up connects.
  return <OrderTracking initialOrder={order} />;
}
