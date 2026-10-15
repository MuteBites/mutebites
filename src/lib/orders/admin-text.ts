import type { AdminOrder } from "@/lib/data/admin";
import { formatRupees } from "@/lib/format";
import { formatStoredMobile } from "@/lib/phone";
import { formatOrderNumber } from "./status";
import { OFFERS } from "@/lib/offers";

/** "A1 Biryani Dum Biryani - 1" — the one way the admin side writes a line item (card, WhatsApp, copy).
 *  A biryani given free by the offer reads "… - 1 (free)", so the restaurant knows too. */
export function itemLine(item: { dishName: string; extras?: string[]; quantity: number; isFree?: boolean }): string {
  const extras = item.extras?.length ? ` + ${item.extras.join(" + ")}` : "";
  return `${item.dishName}${extras} - ${item.quantity}${item.isFree ? " (free)" : ""}`;
}

/** "10% off: -₹42" / "Free single biryani: -₹200" — the order's offer, for admin text. */
export function offerLine(order: Pick<AdminOrder, "discountOffer" | "discountAmount">): string | null {
  if (!order.discountOffer) return null;
  return `${OFFERS[order.discountOffer].short}: -${formatRupees(order.discountAmount)}`;
}

/** Each dish on its own line with its price; the offer, then a total line when there's more than one dish or a discount. */
function itemLinesWithPrices(order: AdminOrder): string[] {
  const lines = order.items.map((i) => `${itemLine(i)} (${i.isFree ? "free" : formatRupees(i.subtotal)})`);
  const offer = offerLine(order);
  if (offer) lines.push(offer);
  if (order.items.length > 1 || offer) lines.push(`Total: ${formatRupees(order.totalAmount)}`);
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

/**
 * The copy button's text: name and number first, then the restaurant and
 * each dish — nothing else (no token, prices or times).
 */
export function orderDetailsText(order: AdminOrder): string {
  return [
    order.studentName,
    formatStoredMobile(order.contactPhone),
    order.restaurantName,
    ...order.items.map(itemLine),
  ].join("\n");
}
