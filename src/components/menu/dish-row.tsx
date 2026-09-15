"use client";

import { Minus, Plus } from "lucide-react";
import { VegMark } from "@/components/veg-mark";
import { MAX_QUANTITY } from "@/lib/cart/store";
import type { Dish } from "@/lib/data/types";
import { formatRupees } from "@/lib/format";
import { cn } from "@/lib/utils";

export function DishRow({
  dish,
  quantity,
  orderable,
  pausedOnly = false,
  onAdd,
  onChangeQuantity,
}: {
  dish: Dish;
  quantity: number;
  /** false when the restaurant is closed, or campus-wide ordering is paused — dishes are browse-only. */
  orderable: boolean;
  /** True when `orderable` is false only because of the campus-wide pause, not this restaurant's own status. */
  pausedOnly?: boolean;
  onAdd: () => void;
  onChangeQuantity: (quantity: number) => void;
}) {
  const soldOut = !dish.is_available;

  return (
    <article className="flex items-start gap-4 border-b py-5 last:border-b-0">
      <div className={cn("min-w-0 flex-1", soldOut && "opacity-55")}>
        <div className="flex items-start gap-2.5">
          <VegMark isVeg={dish.is_veg} className="mt-1" />
          <h3
            className={cn(
              "text-lg leading-snug font-semibold",
              soldOut && "text-muted-foreground line-through",
            )}
          >
            {dish.name}
          </h3>
        </div>
        {dish.note && (
          <p className="mt-1 ml-7 inline-block rounded-md bg-brand-soft px-2 py-0.5 text-sm font-medium text-brand-soft-foreground">
            {dish.note}
          </p>
        )}
        <p className="mt-1.5 ml-7 font-heading text-lg font-bold">{formatRupees(dish.price)}</p>
      </div>

      <div className="flex w-28 shrink-0 justify-end pt-0.5">
        {soldOut ? (
          <span className="flex h-11 w-full items-center justify-center rounded-xl bg-secondary text-sm font-semibold text-muted-foreground">
            Sold out
          </span>
        ) : !orderable ? (
          <span className="flex h-11 w-full items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
            {pausedOnly ? "Paused" : "Closed"}
          </span>
        ) : quantity === 0 ? (
          <button
            type="button"
            onClick={onAdd}
            aria-label={`Add ${dish.name}`}
            className="h-11 w-full rounded-xl border-[1.5px] border-primary bg-card font-heading text-lg font-bold text-primary outline-none transition-colors hover:bg-brand-soft focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            ADD
          </button>
        ) : (
          <div className="flex h-11 w-full items-center justify-between rounded-xl bg-primary p-1 text-primary-foreground">
            <button
              type="button"
              onClick={() => onChangeQuantity(quantity - 1)}
              aria-label={`Remove one ${dish.name}`}
              className="flex size-9 items-center justify-center rounded-lg bg-white/15 outline-none hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white"
            >
              <Minus className="size-4" />
            </button>
            <span className="font-heading text-lg font-bold tabular-nums" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => onChangeQuantity(quantity + 1)}
              disabled={quantity >= MAX_QUANTITY}
              aria-label={`Add one more ${dish.name}`}
              className="flex size-9 items-center justify-center rounded-lg bg-white/15 outline-none hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white disabled:opacity-40"
            >
              <Plus className="size-4" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
