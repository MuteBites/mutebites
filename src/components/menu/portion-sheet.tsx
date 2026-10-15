"use client";

import { Minus, Plus, X } from "lucide-react";
import { BlurImage } from "@/components/blur-image";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { VegMark } from "@/components/veg-mark";
import { MAX_QUANTITY } from "@/lib/cart/store";
import { getDishPhoto } from "@/lib/data/dish-photos";
import type { Dish } from "@/lib/data/types";
import { formatRupees } from "@/lib/format";
import type { Portion } from "@/lib/menu/portions";
import { cn } from "@/lib/utils";

export type PortionPick = { base: string; portions: Portion[] };

/**
 * "Choose a size" — the bottom sheet a sized DishCard opens (Apples: 500 g
 * / 1 kg; Sugarcane Juice: Glass / 1 Bottle; Chicken Tandoori: Half /
 * Full). One row per size with its price and its own Add / stepper, so a
 * student can take a 500 g and a 1 kg in one go; each size is still its own
 * dish in the cart. Sold-out sizes show but can't be added. Ported from
 * College Bites' portion picker.
 */
export function PortionSheet({
  pick,
  restaurantName,
  quantityOf,
  onAdd,
  onChangeQuantity,
  onClose,
}: {
  pick: PortionPick | null;
  restaurantName: string;
  quantityOf: (dishId: string) => number;
  onAdd: (dish: Dish) => void;
  onChangeQuantity: (dishId: string, quantity: number) => void;
  onClose: () => void;
}) {
  const first = pick?.portions[0]?.dish;
  const photo = pick ? pick.portions.map((p) => getDishPhoto(restaurantName, p.dish.name)).find(Boolean) : undefined;

  return (
    <Sheet open={pick !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto max-h-[92dvh] w-full max-w-md gap-0 rounded-t-[2rem] border-t-0 bg-background p-0 text-base"
      >
        {pick && first && (
          <>
            <header className="flex items-center gap-3 border-b px-6 pt-6 pb-4">
              <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-soft font-heading text-2xl font-bold text-brand-soft-foreground/60">
                {photo ? (
                  <BlurImage src={photo} alt="" sizes="56px" className="object-cover" />
                ) : (
                  <span aria-hidden="true">{pick.base.trim().charAt(0)}</span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <SheetTitle className="font-heading text-title leading-tight font-bold">
                  <VegMark isVeg={first.is_veg} className="mr-1.5 inline-flex size-4 -translate-y-px align-middle" />
                  {pick.base}
                </SheetTitle>
                <SheetDescription className="mt-0.5 text-sm">Choose a size</SheetDescription>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary outline-none hover:bg-secondary/80 focus-visible:ring-3 focus-visible:ring-ring/80"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </header>

            <ul className="divide-y overflow-y-auto px-6">
              {pick.portions.map(({ label, dish }) => {
                const qty = quantityOf(dish.id);
                const soldOut = !dish.is_available;
                return (
                  <li key={dish.id} className={cn("flex items-center gap-3 py-4", soldOut && "opacity-55")}>
                    <div className="min-w-0 flex-1">
                      <p className={cn("font-semibold", soldOut && "line-through")}>
                        {label}
                        {dish.note && <span className="ml-1.5 text-xs font-semibold text-rose">{dish.note}</span>}
                      </p>
                      <p className="font-heading text-lg font-bold text-primary tabular-nums">{formatRupees(dish.price)}</p>
                    </div>
                    {soldOut ? (
                      <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-muted-foreground">
                        Sold out
                      </span>
                    ) : qty === 0 ? (
                      <button
                        type="button"
                        onClick={() => onAdd(dish)}
                        aria-label={`Add ${pick.base}, ${label}`}
                        className="surface-primary flex h-11 items-center gap-1.5 rounded-full bg-primary px-5 font-bold text-primary-foreground shadow-raised outline-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/80"
                      >
                        <Plus className="size-4" strokeWidth={2.5} />
                        Add
                      </button>
                    ) : (
                      <div className="surface-primary glow-amber flex h-11 w-[7.25rem] items-center rounded-full bg-primary p-1 text-primary-foreground">
                        <button
                          type="button"
                          onClick={() => onChangeQuantity(dish.id, qty - 1)}
                          aria-label={`Remove one ${pick.base}, ${label}`}
                          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 outline-none hover:bg-primary-foreground/25 focus-visible:ring-2 focus-visible:ring-primary-foreground"
                        >
                          <Minus className="size-4" />
                        </button>
                        <span key={qty} className="animate-bounce-count flex-1 text-center font-bold tabular-nums" aria-live="polite">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => onChangeQuantity(dish.id, qty + 1)}
                          disabled={qty >= MAX_QUANTITY}
                          aria-label={`Add one more ${pick.base}, ${label}`}
                          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 outline-none hover:bg-primary-foreground/25 focus-visible:ring-2 focus-visible:ring-primary-foreground disabled:opacity-40"
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            <footer className="border-t px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={onClose}
                className="flex h-12 w-full items-center justify-center rounded-full border bg-card font-semibold shadow-card outline-none hover:border-ring/50 focus-visible:ring-3 focus-visible:ring-ring/80"
              >
                Done
              </button>
            </footer>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
