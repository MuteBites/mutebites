"use client";

import { useState } from "react";
import { CartBar } from "@/components/cart/cart-bar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { addToCart, conflictsWithCart, setQuantity, useCart } from "@/lib/cart/store";
import type { Dish, MenuSection, Restaurant } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { DishRow } from "./dish-row";

const ALL = "all";
const sectionKey = (s: MenuSection) => s.category?.id ?? "uncategorized";
const sectionName = (s: MenuSection) => s.category?.name ?? "More";

export function MenuView({
  restaurant,
  sections,
  profilePhone,
  orderingEnabled,
}: {
  restaurant: Restaurant;
  sections: MenuSection[];
  profilePhone: string;
  /** Campus-wide kill switch — dishes become un-addable when off, same as a closed restaurant. */
  orderingEnabled: boolean;
}) {
  const cart = useCart();
  const [filter, setFilter] = useState(ALL);
  // Dish waiting on "replace your cart?" confirmation.
  const [pendingDish, setPendingDish] = useState<Dish | null>(null);

  const cartRestaurant = { id: restaurant.id, name: restaurant.name };
  const quantityOf = (dishId: string) =>
    cart.restaurantId === restaurant.id
      ? (cart.lines.find((l) => l.dishId === dishId)?.quantity ?? 0)
      : 0;

  function handleAdd(dish: Dish) {
    if (conflictsWithCart(restaurant.id)) setPendingDish(dish);
    else addToCart(cartRestaurant, dish);
  }

  const visible = filter === ALL ? sections : sections.filter((s) => sectionKey(s) === filter);

  return (
    <>
      {sections.length > 1 && (
        <nav
          aria-label="Menu categories"
          className="sticky top-0 z-10 -mx-6 border-b bg-background/95 py-3 backdrop-blur"
        >
          <ul className="flex gap-2 overflow-x-auto px-6 [scrollbar-width:none]">
            {[{ key: ALL, name: "All" }, ...sections.map((s) => ({ key: sectionKey(s), name: sectionName(s) }))].map(
              (chip) => (
                <li key={chip.key} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setFilter(chip.key)}
                    aria-pressed={filter === chip.key}
                    className={cn(
                      "h-10 rounded-full px-4 font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40",
                      filter === chip.key
                        ? "bg-ink text-ink-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-border",
                    )}
                  >
                    {chip.name}
                  </button>
                </li>
              ),
            )}
          </ul>
        </nav>
      )}

      {sections.length === 0 && (
        <p className="py-16 text-center text-muted-foreground">No dishes on the menu yet.</p>
      )}

      {visible.map((section) => (
        <section key={sectionKey(section)} aria-labelledby={`sec-${sectionKey(section)}`} className="pt-6">
          <h2
            id={`sec-${sectionKey(section)}`}
            className="font-mono text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase"
          >
            {sectionName(section)}
          </h2>
          {section.dishes.map((dish) => (
            <DishRow
              key={dish.id}
              dish={dish}
              quantity={quantityOf(dish.id)}
              orderable={restaurant.is_active && orderingEnabled}
              pausedOnly={restaurant.is_active && !orderingEnabled}
              onAdd={() => handleAdd(dish)}
              onChangeQuantity={(q) => setQuantity(dish.id, q)}
            />
          ))}
        </section>
      ))}

      <CartBar
        profilePhone={profilePhone}
        currentRestaurantId={restaurant.id}
        orderingEnabled={orderingEnabled}
      />

      <AlertDialog open={pendingDish !== null} onOpenChange={(open) => !open && setPendingDish(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">Start a new cart?</AlertDialogTitle>
            <AlertDialogDescription>
              Your cart has items from {cart.restaurantName}. Each order is from one restaurant, so
              adding this will clear that cart.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my cart</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDish) addToCart(cartRestaurant, pendingDish);
                setPendingDish(null);
              }}
            >
              Start new cart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
