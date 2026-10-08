"use client";

import { useSyncExternalStore } from "react";
import { MAX_QUANTITY } from "./limits";

// The cart lives in the browser only (localStorage) until the order is
// placed. One cart = one restaurant, because every order row belongs to a
// single restaurant. Name/price here are for display; the server re-reads
// real prices from the menu when the order is placed.

export type CartLine = {
  dishId: string;
  name: string;
  /** The dish's own price; extras are priced separately in `addons`. */
  price: number;
  isVeg: boolean;
  quantity: number;
  /** Extras chosen for this line (Waffle Pops' ice cream etc.); absent = none. */
  addons?: { id: string; name: string; price: number }[];
};

/**
 * A line is a dish plus its exact set of extras — the same dish with
 * different extras is a separate line. With no extras the key is just the
 * dish id, so carts saved before add-ons existed still match.
 */
export function lineKey(line: Pick<CartLine, "dishId" | "addons">) {
  const ids = (line.addons ?? []).map((a) => a.id).sort();
  return ids.length ? `${line.dishId}:${ids.join(",")}` : line.dishId;
}

/** One unit of a line: dish price plus its extras. */
export function linePrice(line: Pick<CartLine, "price" | "addons">) {
  return line.price + (line.addons ?? []).reduce((sum, a) => sum + a.price, 0);
}

export type Cart = {
  restaurantId: string | null;
  restaurantName: string | null;
  lines: CartLine[];
};

export { MAX_QUANTITY };
const STORAGE_KEY = "mutebites.cart.v1";
const EMPTY: Cart = { restaurantId: null, restaurantName: null, lines: [] };

let cart: Cart = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function read(): Cart {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (parsed && Array.isArray(parsed.lines) && parsed.lines.length > 0) return parsed;
  } catch {
    // Corrupt or blocked storage — start empty.
  }
  return EMPTY;
}

function write(next: Cart) {
  cart = next.lines.length > 0 ? next : EMPTY;
  try {
    if (cart === EMPTY) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // Storage unavailable (private mode) — cart still works for this tab.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep tabs in sync: a change in one tab updates the others.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cart = read();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  if (!loaded) {
    cart = read();
    loaded = true;
  }
  return cart;
}

export function useCart(): Cart {
  // Server render (and the first client render) see an empty cart; the
  // stored cart appears right after hydration.
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

export type CartRestaurant = { id: string; name: string };
export type CartDish = { id: string; name: string; price: number; is_veg: boolean };

/** True if adding from this restaurant would throw away another restaurant's cart. */
export function conflictsWithCart(restaurantId: string) {
  const current = getSnapshot();
  return current.lines.length > 0 && current.restaurantId !== restaurantId;
}

/**
 * Short haptic tick on add-to-cart. Only Android's `navigator.vibrate` ever
 * fires — iOS Safari doesn't implement the API at all, so this is a no-op
 * there without any platform sniffing.
 */
function vibrateAdd() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(15);
  }
}

/**
 * Adds a dish (with optional extras, `quantity` of them — default one).
 * Same dish + same extras merges into the existing line. Replaces the cart
 * if it held another restaurant's items.
 */
export function addToCart(
  restaurant: CartRestaurant,
  dish: CartDish,
  options: { addons?: CartLine["addons"]; quantity?: number } = {},
) {
  vibrateAdd();
  const current = getSnapshot();
  const base =
    current.restaurantId === restaurant.id
      ? current
      : { restaurantId: restaurant.id, restaurantName: restaurant.name, lines: [] };

  const addons = options.addons?.length ? options.addons : undefined;
  const add = options.quantity ?? 1;
  const key = lineKey({ dishId: dish.id, addons });
  const existing = base.lines.find((l) => lineKey(l) === key);
  const lines = existing
    ? base.lines.map((l) =>
        lineKey(l) === key ? { ...l, quantity: Math.min(l.quantity + add, MAX_QUANTITY) } : l,
      )
    : [
        ...base.lines,
        {
          dishId: dish.id,
          name: dish.name,
          price: dish.price,
          isVeg: dish.is_veg,
          quantity: Math.min(add, MAX_QUANTITY),
          ...(addons ? { addons } : {}),
        },
      ];

  write({ ...base, lines });
}

/** Replaces the whole cart with the given lines. Used by the "Your usual" quick-refill chip. */
export function refillCart(restaurant: CartRestaurant, lines: CartLine[]) {
  vibrateAdd();
  write({
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    lines: lines.map((l) => ({ ...l, quantity: Math.min(l.quantity, MAX_QUANTITY) })),
  });
}

/** Sets a line's quantity (by `lineKey`; a plain dish's key is its id); 0 removes it. */
export function setQuantity(key: string, quantity: number) {
  const current = getSnapshot();
  const q = Math.max(0, Math.min(quantity, MAX_QUANTITY));
  write({
    ...current,
    lines:
      q === 0
        ? current.lines.filter((l) => lineKey(l) !== key)
        : current.lines.map((l) => (lineKey(l) === key ? { ...l, quantity: q } : l)),
  });
}

export function clearCart() {
  write(EMPTY);
}

export function cartTotals(c: Cart) {
  return c.lines.reduce(
    (t, l) => ({ items: t.items + l.quantity, amount: t.amount + linePrice(l) * l.quantity }),
    { items: 0, amount: 0 },
  );
}

/**
 * Brings the cart in line with the server's menu after a failed order:
 * drops dishes that are gone/sold out and applies current prices.
 */
export function reconcileCart(removedDishIds: string[], updatedPrices: { dishId: string; price: number }[]) {
  const current = getSnapshot();
  const prices = new Map(updatedPrices.map((u) => [u.dishId, u.price]));
  write({
    ...current,
    lines: current.lines
      .filter((l) => !removedDishIds.includes(l.dishId))
      .map((l) => (prices.has(l.dishId) ? { ...l, price: prices.get(l.dishId)! } : l)),
  });
}
