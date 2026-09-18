"use client";

import { Minus, Plus, Repeat, Star } from "lucide-react";
import { BlurImage } from "@/components/blur-image";
import { VegMark } from "@/components/veg-mark";
import { MAX_QUANTITY } from "@/lib/cart/store";
import { getDishPhoto } from "@/lib/data/dish-photos";
import type { Dish } from "@/lib/data/types";
import { formatRupees } from "@/lib/format";
import { cn } from "@/lib/utils";

export function DishRow({
  dish,
  restaurantName,
  quantity,
  orderable,
  pausedOnly = false,
  isFavorite = false,
  isHighlyReordered = false,
  onAdd,
  onChangeQuantity,
}: {
  dish: Dish;
  restaurantName: string;
  quantity: number;
  /** false when the restaurant is closed, or campus-wide ordering is paused — dishes are browse-only. */
  orderable: boolean;
  /** True when `orderable` is false only because of the campus-wide pause, not this restaurant's own status. */
  pausedOnly?: boolean;
  /** This student's most-ordered dish at this restaurant. */
  isFavorite?: boolean;
  /** Campus-wide: several students have each reordered this dish 3+ times. */
  isHighlyReordered?: boolean;
  onAdd: () => void;
  onChangeQuantity: (quantity: number) => void;
}) {
  const soldOut = !dish.is_available;
  const photo = getDishPhoto(restaurantName, dish.name);

  const action = soldOut ? (
    <span className="flex h-11 w-full items-center justify-center rounded-xl bg-secondary text-sm font-semibold text-muted-foreground">
      Sold out
    </span>
  ) : !orderable ? (
    <span className="flex h-11 w-full items-center justify-center rounded-xl border border-dashed bg-card text-sm text-muted-foreground">
      {pausedOnly ? "Paused" : "Closed"}
    </span>
  ) : quantity === 0 ? (
    <button
      type="button"
      onClick={onAdd}
      aria-label={`Add ${dish.name}`}
      className={cn(
        "animate-pop-in h-11 w-full rounded-xl border-[1.5px] border-primary bg-card text-lg font-bold text-primary outline-none transition-colors hover:bg-brand-soft focus-visible:ring-3 focus-visible:ring-ring/40",
        photo && "shadow-md",
      )}
    >
      ADD
    </button>
  ) : (
    <div
      className={cn(
        "animate-pop-in flex h-11 w-full items-center justify-between rounded-xl bg-primary p-1 text-primary-foreground",
        photo && "shadow-md",
      )}
    >
      <button
        type="button"
        onClick={() => onChangeQuantity(quantity - 1)}
        aria-label={`Remove one ${dish.name}`}
        className="flex size-9 items-center justify-center rounded-lg bg-white/15 outline-none hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white"
      >
        <Minus className="size-4" />
      </button>
      <span
        key={quantity}
        className="animate-bounce-count font-heading text-lg font-bold tabular-nums"
        aria-live="polite"
      >
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
  );

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
        {(isFavorite || isHighlyReordered || dish.note) && (
          <div className="mt-1 ml-7 flex flex-wrap gap-1.5">
            {isFavorite && (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary">
                <Star className="size-3.5 fill-primary" aria-hidden="true" /> Your favorite
              </span>
            )}
            {isHighlyReordered && (
              <span className="inline-flex items-center gap-1 rounded-md bg-success-soft px-2 py-0.5 text-sm font-medium text-success">
                <Repeat className="size-3.5" aria-hidden="true" /> Highly re-ordered
              </span>
            )}
            {dish.note && (
              <span className="inline-block rounded-md bg-brand-soft px-2 py-0.5 text-sm font-medium text-brand-soft-foreground">
                {dish.note}
              </span>
            )}
          </div>
        )}
        <p className="mt-1.5 ml-7 font-heading text-lg font-bold">{formatRupees(dish.price)}</p>
      </div>

      {photo ? (
        <div className="w-28 shrink-0">
          <div className="relative">
            <div className="relative aspect-square w-28 overflow-hidden rounded-2xl bg-secondary">
              <BlurImage
                src={photo}
                alt=""
                sizes="112px"
                className={cn("object-cover", soldOut && "opacity-60 grayscale")}
              />
            </div>
            <div className="absolute inset-x-0 top-full -mt-5">{action}</div>
          </div>
          <div className="h-5" aria-hidden="true" />
        </div>
      ) : (
        <div className="flex w-28 shrink-0 justify-end pt-0.5">{action}</div>
      )}
    </article>
  );
}
