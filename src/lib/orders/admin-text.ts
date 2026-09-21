import type { AdminOrder } from "@/lib/data/admin";
import { formatOrderTimestamp } from "@/lib/date";
import { formatRupees } from "@/lib/format";
import { formatStoredMobile } from "@/lib/phone";
import { formatOrderNumber } from "./status";

/** "A1 Biryani Dum Biryani - 1" — the one way the admin side writes a line item (card, WhatsApp, copy). */
export function itemLine(item: { dishName: string; quantity: number }): string {
  return `${item.dishName} - ${item.quantity}`;
}

/** Each dish on its own line with its price; a total line only when there's more than one dish. */
function itemLinesWithPrices(order: AdminOrder): string[] {
  const lines = order.items.map((i) => `${itemLine(i)} (${formatRupees(i.subtotal)})`);
  if (order.items.length > 1) lines.push(`Total: ${formatRupees(order.totalAmount)}`);
  return lines;
}

/** The confirmation the admin sends from an order card's WhatsApp button. */
export function whatsAppConfirmation(order: AdminOrder): string {
  return [
    `Hi ${order.studentName}, this is MuteBites — confirming your order ${formatOrderNumber(order.dailyNumber)}`,
    `from ${order.restaurantName}:`,
    ...itemLinesWithPrices(order),
    "Do you want to go ahead with this order? Reply yes to confirm.",
  ].join("\n");
}

/** Everything on the card as plain text, for the copy button (e.g. to forward to a restaurant). */
export function orderDetailsText(order: AdminOrder): string {
  return [
    `Order ${formatOrderNumber(order.dailyNumber)} · ${formatOrderTimestamp(order.createdAt)}`,
    `From ${order.restaurantName}:`,
    ...itemLinesWithPrices(order),
    ...(order.notes ? [`Note: ${order.notes}`] : []),
    `${order.studentName} · ${formatStoredMobile(order.contactPhone)}`,
  ].join("\n");
}
