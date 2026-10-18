"use client";

import { useEffect, useRef } from "react";

/**
 * Wakes Plum's promo scene: sets `data-seen` on its parent the first time it
 * comes near the screen (so the rider's frame strips, ~470 KB, only load
 * for someone who actually sees the card) and `data-on` while it's on
 * screen (plum-ride.css pauses every animation otherwise). Renders an
 * empty span; the scene is its parent.
 */
export function PlumSceneLive() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const scene = ref.current?.parentElement;
    if (!scene) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          scene.setAttribute("data-seen", "");
          scene.setAttribute("data-on", "");
        } else {
          scene.removeAttribute("data-on");
        }
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(scene);
    return () => io.disconnect();
  }, []);
  return <span ref={ref} hidden />;
}
