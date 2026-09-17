"use client";

import { useState } from "react";
import { Search } from "lucide-react";
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
import { VegMark } from "@/components/veg-mark";
import { addToCart, conflictsWithCart, setQuantity, useCart } from "@/lib/cart/store";
import { AllCategoriesIcon, getCuisineIcon } from "@/lib/cuisine-icons";
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
  favoriteDishId,
  highlyReorderedDishIds,
}: {
  restaurant: Restaurant;
  sections: MenuSection[];
  profilePhone: string;
  /** Campus-wide kill switch — dishes become un-addable when off, same as a closed restaurant. */
  orderingEnabled: boolean;
  /** This student's most-ordered dish at this restaurant, or null — tags it "Your favorite". */
  favoriteDishId: string | null;
  /** Dishes campus-wide with a strong repeat-purchase signal — tags them "Highly re-ordered". */
  highlyReorderedDishIds: Set<string>;
}) {
  const cart = useCart();
  const [filter, setFilter] = useState(ALL);
  const [vegOnly, setVegOnly] = useState(false);
  const [query, setQuery] = useState("");
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

  const q = query.trim().toLowerCase();
  // Searching looks across the whole menu, not just the selected category
  // chip — a student searching usually doesn't know (or care) which
  // category something's in.
  const byCategory = q || filter === ALL ? sections : sections.filter((s) => sectionKey(s) === filter);
  const byVeg = vegOnly
    ? byCategory.map((s) => ({ ...s, dishes: s.dishes.filter((d) => d.is_veg) })).filter((s) => s.dishes.length > 0)
    : byCategory;
  const visible = q
    ? byVeg
        .map((s) => ({ ...s, dishes: s.dishes.filter((d) => d.name.toLowerCase().includes(q)) }))
        .filter((s) => s.dishes.length > 0)
    : byVeg;

  return (
    <>
      {sections.length > 1 && (
        <nav
          aria-label="Menu categories"
          className="sticky top-0 z-10 -mx-6 border-b bg-background/95 py-3 backdrop-blur"
        >
          <ul className="flex gap-2 overflow-x-auto px-6 [scrollbar-width:none]">
            {[{ key: ALL, name: "All" }, ...sections.map((s) => ({ key: sectionKey(s), name: sectionName(s) }))].map(
              (chip) => {
                const Icon = chip.key === ALL ? AllCategoriesIcon : getCuisineIcon(chip.name);
                return (
                  <li key={chip.key} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setFilter(chip.key)}
                      aria-pressed={filter === chip.key}
                      className={cn(
                        "flex h-10 items-center gap-1.5 rounded-full px-4 font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40",
                        filter === chip.key
                          ? "bg-ink text-ink-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-border",
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      {chip.name}
                    </button>
                  </li>
                );
              },
            )}
          </ul>
        </nav>
      )}

      {sections.length > 0 && (
        <div className="mt-4 flex items-center gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search dishes</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes…"
              className="h-10 w-full rounded-full bg-secondary pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </label>
          <button
            type="button"
            onClick={() => setVegOnly((v) => !v)}
            aria-pressed={vegOnly}
            className={cn(
              "flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40",
              vegOnly
                ? "border-success bg-success-soft text-success"
                : "bg-card text-muted-foreground hover:bg-secondary",
            )}
          >
            <VegMark isVeg className="size-4" />
            Veg only
          </button>
        </div>
      )}

      {sections.length === 0 && (
        <p className="py-16 text-center text-muted-foreground">Nothing on the menu yet — check back soon.</p>
      )}

      {sections.length > 0 && visible.length === 0 && (
        <p className="py-16 text-center text-muted-foreground">
          {q
            ? `No dishes match “${query.trim()}” — try a different search.`
            : "No veg dishes in this category — try another one."}
        </p>
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
              restaurantName={restaurant.name}
              quantity={quantityOf(dish.id)}
              orderable={restaurant.is_active && orderingEnabled}
              pausedOnly={restaurant.is_active && !orderingEnabled}
              isFavorite={dish.id === favoriteDishId}
              isHighlyReordered={highlyReorderedDishIds.has(dish.id)}
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
