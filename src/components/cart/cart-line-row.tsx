"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { MAX_QUANTITY } from "@/lib/cart/limits";
import { setQuantity, type CartLine } from "@/lib/cart/store";
import { formatRupees } from "@/lib/format";
import { VegMark } from "@/components/veg-mark";

const SWIPE_THRESHOLD = 88;
const MAX_DRAG = 132;
const REMOVE_DELAY = 180;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * One cart line, swipeable left to remove — an additional gesture layered
 * on top of the existing minus/plus buttons, not a replacement: the
 * buttons stay as the accessible way to remove an item for anyone who
 * can't (or doesn't know to) swipe.
 */
export function CartLineRow({ line }: { line: CartLine }) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [removing, setRemoving] = useState(false);
  const startX = useRef(0);
  const activePointerId = useRef<number | null>(null);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (removing) return;
    // A tap starting on the quantity buttons shouldn't start a drag — let
    // their own click behave exactly as before, uncaptured.
    if ((e.target as HTMLElement).closest("button")) return;
    activePointerId.current = e.pointerId;
    startX.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (activePointerId.current !== e.pointerId) return;
    const next = Math.min(0, Math.max(-MAX_DRAG, e.clientX - startX.current));
    setDragX(next);
  }

  function endDrag(e: ReactPointerEvent<HTMLDivElement>, commit: boolean) {
    if (activePointerId.current !== e.pointerId) return;
    activePointerId.current = null;
    setDragging(false);
    if (commit && dragX <= -SWIPE_THRESHOLD) {
      setRemoving(true);
      setDragX(-400);
      setTimeout(() => setQuantity(line.dishId, 0), prefersReducedMotion() ? 0 : REMOVE_DELAY);
    } else {
      setDragX(0);
    }
  }

  return (
    <li className="relative overflow-hidden border-b">
      <div
        className="absolute inset-y-0 right-0 flex w-24 items-center justify-center gap-1.5 bg-destructive text-sm font-semibold text-white"
        aria-hidden="true"
      >
        <Trash2 className="size-4" />
        Remove
      </div>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => endDrag(e, true)}
        onPointerCancel={(e) => endDrag(e, false)}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging || prefersReducedMotion() ? "none" : "transform 200ms ease-out",
        }}
        className="relative flex touch-pan-y items-center gap-3 bg-background py-4"
      >
        <VegMark isVeg={line.isVeg} />
        <div className="min-w-0 flex-1">
          <p className="leading-snug font-semibold">{line.name}</p>
          <p className="text-sm text-muted-foreground">{formatRupees(line.price)} each</p>
        </div>
        <div className="flex h-11 items-center gap-1 rounded-xl border bg-card p-1">
          <button
            type="button"
            onClick={() => setQuantity(line.dishId, line.quantity - 1)}
            aria-label={`Remove one ${line.name}`}
            className="flex size-8 items-center justify-center rounded-lg bg-secondary outline-none hover:bg-border focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-6 text-center font-semibold tabular-nums">{line.quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity(line.dishId, line.quantity + 1)}
            disabled={line.quantity >= MAX_QUANTITY}
            aria-label={`Add one more ${line.name}`}
            className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-primary outline-none hover:bg-primary/15 focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <p className="w-16 text-right font-heading font-bold tabular-nums">
          {formatRupees(line.price * line.quantity)}
        </p>
      </div>
    </li>
  );
}
