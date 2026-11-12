import type { AdminOrder } from "@/lib/data/admin";
import { formatTime } from "@/lib/date";
import { orderPromise } from "@/lib/delivery";
import { formatOrderNumber } from "./status";

/** One dish line for a restaurant: the same dish with the same extras, summed over orders. */
export type KitchenLine = { name: string; quantity: number; free: boolean };

export type KitchenRestaurant = {
  restaurantId: string;
  restaurantName: string;
  lines: KitchenLine[];
  /** Daily tokens of the orders in this list, ascending. */
  tokens: number[];
  items: number;
};

export type KitchenSlot = {
  /** When they're due (epoch ms), or "tbc" for orders with no delivery time set yet. */
  key: string;
  label: string;
  orders: number;
  restaurants: KitchenRestaurant[];
};

/**
 * The Kitchen sheet's data: orders grouped by when they're due (lunch
 * 1:45–2 PM, or the batch time each was promised), then by restaurant, each dish summed — "Chicken Fry
 * Biryani × 6" — so the admin can send each restaurant one list per slot
 * instead of order by order. Extras are part of the dish's name
 * ("Nutella Pop + Ice cream"); a free biryani stays its own line.
 * Earliest first; "No time set" last.
 */
export function buildKitchen(orders: AdminOrder[]): KitchenSlot[] {
  const slots = new Map<string, { end: number | null; window?: string; orders: AdminOrder[] }>();
  for (const order of orders) {
    const due = orderPromise(order);
    const end = due ? new Date(due.deliverAt).getTime() : null;
    const key = end === null ? "tbc" : String(end);
    const slot = slots.get(key) ?? { end, window: due?.window, orders: [] };
    slot.orders.push(order);
    slots.set(key, slot);
  }

  return [...slots.entries()]
    .sort(([, a], [, b]) => (a.end ?? Infinity) - (b.end ?? Infinity))
    .map(([key, slot]) => ({
      key,
      label:
        slot.end === null
          ? "No time set"
          : slot.window
            ? `Lunch ${slot.window}`
            : `By ${formatTime(new Date(slot.end).toISOString())}`,
      orders: slot.orders.length,
      restaurants: byRestaurant(slot.orders),
    }));
}

function byRestaurant(orders: AdminOrder[]): KitchenRestaurant[] {
  const map = new Map<string, KitchenRestaurant & { index: Map<string, KitchenLine> }>();
  for (const order of orders) {
    const r = map.get(order.restaurantId) ?? {
      restaurantId: order.restaurantId,
      restaurantName: order.restaurantName,
      lines: [],
      tokens: [],
      items: 0,
      index: new Map<string, KitchenLine>(),
    };
    r.tokens.push(order.dailyNumber);
    for (const item of order.items) {
      const name = item.extras.length ? `${item.dishName} + ${item.extras.join(" + ")}` : item.dishName;
      const key = `${name}|${item.isFree}`;
      const line = r.index.get(key);
      if (line) line.quantity += item.quantity;
      else {
        const next = { name, quantity: item.quantity, free: item.isFree };
        r.index.set(key, next);
        r.lines.push(next);
      }
      r.items += item.quantity;
    }
    map.set(order.restaurantId, r);
  }
  return [...map.values()]
    .map((r) => ({
      restaurantId: r.restaurantId,
      restaurantName: r.restaurantName,
      items: r.items,
      tokens: [...r.tokens].sort((a, b) => a - b),
      lines: [...r.lines].sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => b.items - a.items);
}

/** What Copy / WhatsApp send to the restaurant: its name, each dish "- qty", then the tokens. */
export function kitchenText(r: KitchenRestaurant, slotLabel: string): string {
  return [
    `${r.restaurantName} · ${slotLabel}`,
    ...r.lines.map((l) => `${l.name} - ${l.quantity}${l.free ? " (free)" : ""}`),
    `Orders: ${r.tokens.map(formatOrderNumber).join(", ")}`,
  ].join("\n");
}
