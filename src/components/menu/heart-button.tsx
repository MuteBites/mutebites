"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { setDishLiked } from "@/lib/favorites/actions";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

/**
 * The heart on a menu dish. Fills the moment it's tapped (a pop and a
 * tiny buzz where supported) and saves in the background; a failed save
 * puts it back with a toast. The page isn't re-rendered per heart, so taps
 * are remembered for the session (TAPPED) — Back to a menu restores the
 * router's cached copy, which would otherwise show the old heart. Hearts
 * are private (favorite_dishes). Ported from College Bites.
 *
 * `tone="photo"` floats on a dish photo (a frosted plate); `tone="row"`
 * sits in a photo-less list row (no plate).
 */
const TAPPED = new Map<string, boolean>();

export function HeartButton({
  dishId,
  dishName,
  initialLiked,
  tone = "photo",
}: {
  dishId: string;
  dishName: string;
  initialLiked: boolean;
  tone?: "photo" | "row";
}) {
  const [liked, setLikedState] = useState(() => TAPPED.get(dishId) ?? initialLiked);
  function setLiked(value: boolean) {
    TAPPED.set(dishId, value);
    setLikedState(value);
  }
  const [pops, setPops] = useState(0);
  const [, startTransition] = useTransition();

  function toggle() {
    const next = !liked;
    setLiked(next);
    if (next) {
      setPops((n) => n + 1);
      navigator.vibrate?.(10);
    }
    startTransition(async () => {
      const result = await setDishLiked(dishId, next);
      if (!result.ok) {
        setLiked(!next);
        toast.error(result.error);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={liked}
      aria-label={`Heart ${dishName}`}
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/80",
        tone === "photo" ? "bg-card/90 shadow-card backdrop-blur-sm" : "hover:bg-secondary",
      )}
    >
      <Heart
        key={pops}
        strokeWidth={2.25}
        className={cn(
          "size-[1.15rem]",
          liked ? "animate-pop-in fill-primary text-primary" : "text-muted-foreground",
        )}
      />
    </button>
  );
}
