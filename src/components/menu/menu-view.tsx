"use client";

import { useEffect, useState } from "react";
import { Leaf, Search, SearchX, UtensilsCrossed, X } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
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
import { DishCard } from "./dish-card";

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
  focusDishId = null,
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
  /** Dish to scroll to and briefly highlight on arrival (from ?dish=). */
  focusDishId?: string | null;
}) {
  const cart = useCart();
  const [filter, setFilter] = useState(ALL);
  const [vegOnly, setVegOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlighted, setHighlighted] = useState<string | null>(null);

  useEffect(() => {
    if (!focusDishId) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let clear: ReturnType<typeof setTimeout> | undefined;
    // Waits out the page's slide-in view transition (~400ms, see
    // globals.css) so the scroll doesn't fight it; instant with reduced motion.
    const start = setTimeout(
      () => {
        const el = document.getElementById(`dish-${focusDishId}`);
        if (!el) return;
        el.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
        setHighlighted(focusDishId);
        clear = setTimeout(() => setHighlighted(null), 3200);
      },
      reduceMotion ? 0 : 350,
    );
    return () => {
      clearTimeout(start);
      clearTimeout(clear);
    };
  }, [focusDishId]);
  // Dish waiting on "replace your cart?" confirmation.
  const [pendingDish, setPendingDish] = useState<Dish | null>(null);

  const cartRestaurant = { id: restaurant.id, name: restaurant.name };
  const quantityOf = (dishId: string) =>
    cart.restaurantId === restaurant.id
      ? (cart.lines.find((l) => l.dishId === dishId)?.quantity ?? 0)
      : 0;

  function closeSearch() {
    setQuery("");
    setSearchOpen(false);
  }

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

  const chips = [{ key: ALL, name: "All" }, ...sections.map((s) => ({ key: sectionKey(s), name: sectionName(s) }))];

  return (
    <>
      {sections.length > 0 && (
        // One sticky row for every way of narrowing the menu — search, veg
        // and category — so none of them scroll away on a 40-dish menu.
        // Search collapses to an icon and expands in place over the rail.
        <div className="sticky top-0 z-10 -mx-6 border-b bg-background/95 px-6 py-2.5 backdrop-blur">
          <div className="flex items-center gap-2">
            {searchOpen ? (
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search dishes</span>
                <Search
                  className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && closeSearch()}
                  placeholder="Search this menu…"
                  className="h-10 w-full rounded-full bg-secondary pr-3 pl-10 outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30 [&::-webkit-search-cancel-button]:hidden"
                />
              </label>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search this menu"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary outline-none hover:bg-border focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                <Search className="size-4.5" />
              </button>
            )}

            {searchOpen ? (
              <button
                type="button"
                onClick={closeSearch}
                aria-label="Close search"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary outline-none hover:bg-border focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                <X className="size-4.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setVegOnly((v) => !v)}
                aria-pressed={vegOnly}
                aria-label="Veg only"
                title="Veg only"
                className={cn(
                  "flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40",
                  vegOnly
                    ? "border-success bg-success-soft text-success"
                    : "bg-card text-muted-foreground hover:bg-secondary",
                )}
              >
                <VegMark isVeg className="size-4" />
                Veg
              </button>
            )}

            {!searchOpen && sections.length > 1 && (
              <nav aria-label="Menu categories" className="-mr-6 min-w-0 flex-1">
                <ul className="flex gap-2 overflow-x-auto pr-6 [scrollbar-width:none]">
                  {chips.map((chip) => {
                    const Icon = chip.key === ALL ? AllCategoriesIcon : getCuisineIcon(chip.name);
                    return (
                      <li key={chip.key} className="shrink-0">
                        <button
                          type="button"
                          onClick={() => setFilter(chip.key)}
                          aria-pressed={filter === chip.key}
                          className={cn(
                            "flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40",
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
                  })}
                </ul>
              </nav>
            )}
          </div>
        </div>
      )}

      {sections.length === 0 && (
        <EmptyState compact icon={UtensilsCrossed} title="Nothing on the menu yet">
          Check back soon.
        </EmptyState>
      )}

      {sections.length > 0 && visible.length === 0 && (
        <EmptyState compact icon={q ? SearchX : Leaf} title={q ? `No dishes match “${query.trim()}”` : "No veg dishes here"}>
          {q ? "Try a different search." : "Try another category, or switch Veg off."}
        </EmptyState>
      )}

      {visible.map((section) => (
        <section key={sectionKey(section)} aria-labelledby={`sec-${sectionKey(section)}`} className="pt-7">
          <h2 id={`sec-${sectionKey(section)}`} className="flex items-baseline gap-2">
            <span className="font-heading text-title font-bold">{sectionName(section)}</span>
            <span className="text-sm font-semibold text-muted-foreground tabular-nums">
              {section.dishes.length}
            </span>
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6">
            {section.dishes.map((dish) => (
              <DishCard
                key={dish.id}
                dish={dish}
                restaurantName={restaurant.name}
                quantity={quantityOf(dish.id)}
                orderable={restaurant.is_active && orderingEnabled}
                pausedOnly={restaurant.is_active && !orderingEnabled}
                isFavorite={dish.id === favoriteDishId}
                isHighlyReordered={highlyReorderedDishIds.has(dish.id)}
                highlighted={highlighted === dish.id}
                onAdd={() => handleAdd(dish)}
                onChangeQuantity={(q) => setQuantity(dish.id, q)}
              />
            ))}
          </div>
        </section>
      ))}

      <div className="h-8" aria-hidden="true" />

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
