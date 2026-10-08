"use client";

import { useState } from "react";
import { Check, Minus, Plus, X } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { VegMark } from "@/components/veg-mark";
import { MAX_QUANTITY } from "@/lib/cart/store";
import type { AddonOption, Dish } from "@/lib/data/types";
import { formatRupees } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * "Add extras" bottom sheet for dishes whose section offers add-ons
 * (category_addons — today only Waffle Pops). Pick any extras and a
 * quantity, then one Add button with the live total. Dishes without
 * add-ons never open this; they keep the one-tap add.
 */
export function AddonSheet({
  dish,
  addons,
  onClose,
  onAdd,
}: {
  /** The dish being added, or null when closed. */
  dish: Dish | null;
  addons: AddonOption[];
  onClose: () => void;
  onAdd: (dish: Dish, chosen: AddonOption[], quantity: number) => void;
}) {
  return (
    <Sheet open={dish !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto max-h-[92dvh] w-full max-w-md gap-0 rounded-t-[2rem] border-t-0 bg-background p-0 text-base"
      >
        {/* Keyed so each opening starts with nothing ticked and quantity 1. */}
        {dish && <AddonPicker key={dish.id} dish={dish} addons={addons} onClose={onClose} onAdd={onAdd} />}
      </SheetContent>
    </Sheet>
  );
}

function AddonPicker({
  dish,
  addons,
  onClose,
  onAdd,
}: {
  dish: Dish;
  addons: AddonOption[];
  onClose: () => void;
  onAdd: (dish: Dish, chosen: AddonOption[], quantity: number) => void;
}) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [quantity, setQuantity] = useState(1);

  const chosen = addons.filter((a) => picked.has(a.id));
  const unit = dish.price + chosen.reduce((sum, a) => sum + a.price, 0);

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <header className="flex items-start gap-3 border-b px-6 pt-6 pb-4">
        <div className="min-w-0 flex-1">
          <SheetTitle className="font-heading text-title font-bold">
            <VegMark isVeg={dish.is_veg} className="mr-1.5 inline-flex size-4 -translate-y-0.5 align-middle" />
            {dish.name}
          </SheetTitle>
          <SheetDescription className="mt-0.5 text-base">{formatRupees(dish.price)}</SheetDescription>
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

      <div className="overflow-y-auto px-6 py-4">
        <p className="text-label text-muted-foreground">Add extras (optional)</p>
        <ul className="mt-2 divide-y rounded-2xl border bg-card">
          {addons.map((addon) => {
            const on = picked.has(addon.id);
            return (
              <li key={addon.id}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggle(addon.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                      on ? "border-primary bg-primary text-primary-foreground" : "border-input",
                    )}
                    aria-hidden="true"
                  >
                    {on && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1 font-medium">{addon.name}</span>
                  <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                    +{formatRupees(addon.price)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <footer className="flex items-center gap-3 border-t px-6 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="flex h-12 items-center gap-1 rounded-full border bg-card p-1">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="One fewer"
            className="flex size-10 items-center justify-center rounded-full outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/80 disabled:opacity-40"
          >
            <Minus className="size-4" />
          </button>
          <span className="min-w-6 text-center font-bold tabular-nums" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
            disabled={quantity >= MAX_QUANTITY}
            aria-label="One more"
            className="flex size-10 items-center justify-center rounded-full outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/80 disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => onAdd(dish, chosen, quantity)}
          className="flex h-12 flex-1 items-center justify-between gap-2 rounded-full bg-primary px-5 font-bold text-primary-foreground outline-none hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring/80"
        >
          <span>Add</span>
          <span className="tabular-nums">{formatRupees(unit * quantity)}</span>
        </button>
      </footer>
    </>
  );
}
