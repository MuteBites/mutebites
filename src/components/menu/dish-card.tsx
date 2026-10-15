"use client";

import { useEffect, useRef } from "react";
import { ChevronRight, Minus, Plus, Repeat, Star } from "lucide-react";
import { BlurImage } from "@/components/blur-image";
import { VegMark } from "@/components/veg-mark";
import { MAX_QUANTITY } from "@/lib/cart/store";
import { getDishPhoto } from "@/lib/data/dish-photos";
import type { Dish } from "@/lib/data/types";
import { formatRupees } from "@/lib/format";
import { splitPortion, type Portion } from "@/lib/menu/portions";
import { cn } from "@/lib/utils";

/*
 * One dish in the menu's two-column photo grid: a big square photo with
 * the add control floating in its corner (one lit amber pill that widens
 * from a round "+" into the "− n +" stepper once the dish is in the cart,
 * while the photo picks up an amber ring), prices in amber, and name + price on the page underneath — no bordered
 * row, no "ADD" button hanging off a thumbnail. Dishes without a photo
 * render as a compact list row instead (name, price, same add control).
 *
 * Size mode (`portions`, e.g. Apples 500 g / 1 kg): one card for the dish —
 * base name, every size's price, the photo — whose "+" opens the menu's
 * size picker instead of adding straight away; once any size is in the
 * cart the control shows the total with a chevron and reopens it.
 */
export function DishCard({
  dish,
  restaurantName,
  quantity,
  orderable,
  pausedOnly = false,
  pausedLabel = "Closed",
  isFavorite = false,
  isHighlyReordered = false,
  highlighted = false,
  hasAddons = false,
  portions,
  onChoosePortion,
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
  /** Chip text when pausedOnly, e.g. "Closed". */
  pausedLabel?: string;
  /** This student's most-ordered dish at this restaurant. */
  isFavorite?: boolean;
  /** Campus-wide: several students have each reordered this dish 3+ times. */
  isHighlyReordered?: boolean;
  /** Just arrived here from a deep link (Trending, Thursday banner) — flash a ring. */
  highlighted?: boolean;
  /** Its section offers extras: + always opens the "Add extras" sheet (no inline stepper — lines differ by extras; the cart edits them). */
  hasAddons?: boolean;
  /** Size mode: the dish's sizes (`dish` is the first one), smallest first. */
  portions?: Portion[];
  /** Size mode: open the size picker for this dish. */
  onChoosePortion?: () => void;
  onAdd: () => void;
  onChangeQuantity: (quantity: number) => void;
}) {
  const sized = portions !== undefined && portions.length > 1;
  const soldOut = sized ? portions.every((p) => !p.dish.is_available) : !dish.is_available;
  // A sized card shows whichever size has a photo (they share one).
  const photo = sized
    ? portions.map((p) => getDishPhoto(restaurantName, p.dish.name)).find(Boolean)
    : getDishPhoto(restaurantName, dish.name);
  const name = sized ? splitPortion(dish.name).base : dish.name;
  const inCart = quantity > 0;

  // Keyboard focus follows the control as it grows and shrinks: "+" → the
  // stepper's "+", and the stepper's "−" (taking it to 0) → "+".
  const addRef = useRef<HTMLButtonElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const moveFocus = useRef(false);
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    (inCart ? moreRef : addRef).current?.focus();
  }, [inCart]);

  const control = soldOut ? null : !orderable ? (
    <span className="rounded-full bg-card/90 px-2.5 py-1 text-xs font-semibold text-muted-foreground backdrop-blur-sm">
      {pausedOnly ? pausedLabel : "Closed"}
    </span>
  ) : sized ? (
    // Size mode: "+" (or the count, once something's in) opens the picker.
    <button
      type="button"
      onClick={onChoosePortion}
      aria-haspopup="dialog"
      aria-label={
        inCart
          ? `Change ${name}, ${quantity} in cart`
          : `Choose ${name}: ${portions.map((p) => p.label).join(" or ")}`
      }
      className={cn(
        "surface-primary flex h-11 items-center justify-center gap-0.5 rounded-full bg-primary font-bold text-primary-foreground outline-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/80",
        inCart ? "glow-amber min-w-11 pr-2 pl-3.5" : "w-11 shadow-raised",
      )}
    >
      {inCart ? (
        <>
          <span key={quantity} className="animate-bounce-count tabular-nums">
            {quantity}
          </span>
          <ChevronRight className="size-4" strokeWidth={2.5} />
        </>
      ) : (
        <Plus className="size-5" strokeWidth={2.5} />
      )}
    </button>
  ) : hasAddons ? (
    // Extras mode: "+" always opens the extras sheet (lines differ by
    // extras, so there's no inline stepper); a count badge once it's in.
    <button
      type="button"
      onClick={onAdd}
      aria-haspopup="dialog"
      aria-label={inCart ? `Add another ${dish.name} (${quantity} in cart)` : `Add ${dish.name}`}
      className={cn(
        "surface-primary relative flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground outline-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/80",
        inCart ? "glow-amber" : "shadow-raised",
      )}
    >
      <Plus className="size-5" strokeWidth={2.5} />
      {inCart && (
        <span
          key={quantity}
          className="animate-pop-in absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full bg-ink px-1 text-xs font-bold text-ink-foreground tabular-nums ring-2 ring-background"
          aria-hidden="true"
        >
          {quantity}
        </span>
      )}
    </button>
  ) : (
    // One lit pill that widens from a round "+" into the "− n +" stepper
    // and shrinks back. It only glows once the dish is in the cart — a
    // plain lift before that, so a 40-dish grid isn't 40 glows.
    <div
      className={cn(
        "surface-primary flex h-11 items-center overflow-hidden rounded-full bg-primary text-primary-foreground transition-[width,box-shadow] duration-(--dur-base) ease-spring",
        inCart ? "glow-amber w-[7.25rem] p-1" : "w-11 shadow-raised",
      )}
    >
      {!inCart ? (
        <button
          ref={addRef}
          type="button"
          onClick={() => {
            moveFocus.current = addRef.current === document.activeElement;
            onAdd();
          }}
          aria-label={`Add ${dish.name}`}
          className="flex size-11 shrink-0 items-center justify-center rounded-full outline-none hover:bg-primary-foreground/10 focus-visible:ring-3 focus-visible:ring-ring/80"
        >
          <Plus className="size-5" strokeWidth={2.5} />
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={(e) => {
              moveFocus.current = quantity === 1 && e.currentTarget === document.activeElement;
              onChangeQuantity(quantity - 1);
            }}
            aria-label={`Remove one ${dish.name}`}
            className="animate-pop-in flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 outline-none hover:bg-primary-foreground/25 focus-visible:ring-2 focus-visible:ring-primary-foreground"
          >
            <Minus className="size-4" />
          </button>
          <span
            key={quantity}
            className="animate-bounce-count min-w-5 flex-1 text-center text-base font-bold tabular-nums"
            aria-live="polite"
          >
            {quantity}
          </span>
          <button
            ref={moreRef}
            type="button"
            onClick={() => onChangeQuantity(quantity + 1)}
            disabled={quantity >= MAX_QUANTITY}
            aria-label={`Add one more ${dish.name}`}
            className="animate-pop-in flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 outline-none hover:bg-primary-foreground/25 focus-visible:ring-2 focus-visible:ring-primary-foreground disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </>
      )}
    </div>
  );

  const tag = isFavorite ? (
    <>
      <Star className="size-3 shrink-0 fill-primary text-primary" aria-hidden="true" />
      <span className="truncate">Your favorite</span>
    </>
  ) : isHighlyReordered ? (
    <>
      <Repeat className="size-3 shrink-0 text-success" aria-hidden="true" />
      <span className="truncate">Highly re-ordered</span>
    </>
  ) : null;

  // Price line: every size with its price on a sized card ("500 g ₹140
  // 1 kg ₹265"), otherwise the price and the dish's note.
  const prices = (size: "text-base" | "text-lg") =>
    sized ? (
      portions.map((p) => (
        <span key={p.dish.id} className={cn("text-sm whitespace-nowrap", !p.dish.is_available && "line-through")}>
          <span className="text-muted-foreground">{p.label}</span>{" "}
          <span className={cn("font-heading font-bold text-primary", size)}>{formatRupees(p.dish.price)}</span>
        </span>
      ))
    ) : (
      <>
        <span className={cn("font-heading font-bold text-primary", size)}>{formatRupees(dish.price)}</span>
        {dish.note && <span className="text-xs font-semibold text-rose">{dish.note}</span>}
      </>
    );
  // Deep links (?dish=) to another size land on this card too.
  const sizeAnchors =
    sized &&
    portions
      .slice(1)
      .map((p) => <span key={p.dish.id} id={`dish-${p.dish.id}`} className="block scroll-mt-24" aria-hidden="true" />);

  // No photo: a compact list row instead of a photo tile with an empty
  // placeholder (MenuView lists these under each section's photo grid).
  if (!photo) {
    return (
      <article
        id={`dish-${dish.id}`}
        className={cn(
          "flex min-w-0 scroll-mt-24 items-center gap-3 px-4 py-3",
          highlighted &&
            "animate-highlight rounded-2xl motion-reduce:outline-3 motion-reduce:outline-offset-3 motion-reduce:outline-rose",
        )}
      >
        <div className={cn("min-w-0 flex-1", soldOut && "opacity-55")}>
          {tag && <p className="mb-0.5 inline-flex items-center gap-1 text-xs font-semibold">{tag}</p>}
          <h3 className={cn("leading-snug font-semibold", soldOut && "text-muted-foreground line-through")}>
            <VegMark isVeg={dish.is_veg} className="mr-1.5 inline-flex size-4 -translate-y-px align-middle" />
            {name}
          </h3>
          <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2">{prices("text-base")}</p>
          {sizeAnchors}
        </div>
        {soldOut ? (
          <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            Sold out
          </span>
        ) : (
          control && <div className="shrink-0">{control}</div>
        )}
      </article>
    );
  }

  return (
    <article id={`dish-${dish.id}`} className="min-w-0 scroll-mt-24">
      {sizeAnchors}
      <div
        className={cn(
          "group/photo relative aspect-square rounded-3xl bg-secondary transition-shadow",
          inCart && "ring-3 ring-primary ring-offset-2 ring-offset-background",
          highlighted &&
            "animate-highlight motion-reduce:outline-3 motion-reduce:outline-offset-3 motion-reduce:outline-rose",
        )}
      >
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          {/* The photo leans in a little on hover (mouse only). On a wrapper,
              so it doesn't fight BlurImage's own fade-in transition. */}
          <div className="absolute inset-0 transition-transform duration-(--dur-slow) ease-out-expo group-hover/photo:scale-105">
            <BlurImage
              src={photo}
              alt=""
              sizes="(min-width: 448px) 200px, 45vw"
              className={cn("object-cover", soldOut && "opacity-60 grayscale")}
            />
          </div>
        </div>

        {tag && (
          <span className="absolute top-2 left-2 inline-flex max-w-[calc(100%-1rem)] items-center gap-1 rounded-full bg-card/90 px-2 py-0.5 text-xs font-semibold backdrop-blur-sm">
            {tag}
          </span>
        )}

        {soldOut && (
          <span className="absolute inset-x-0 bottom-3 mx-auto w-fit rounded-full bg-card/90 px-3 py-1 text-xs font-semibold text-muted-foreground backdrop-blur-sm">
            Sold out
          </span>
        )}

        {control && <div className="absolute right-2 bottom-2">{control}</div>}
      </div>

      <div className={cn("px-1 pt-2.5", soldOut && "opacity-55")}>
        <h3
          className={cn(
            "line-clamp-2 leading-snug font-semibold",
            soldOut && "text-muted-foreground line-through",
          )}
        >
          <VegMark isVeg={dish.is_veg} className="mr-1.5 inline-flex size-4 -translate-y-px align-middle" />
          {name}
        </h3>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2">{prices("text-lg")}</p>
      </div>
    </article>
  );
}
