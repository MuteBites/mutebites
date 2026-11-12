"use client";

import { useEffect, useRef } from "react";
import { formatRupees } from "@/lib/format";

export type CountKind = "int" | "rupees" | "percent";

function format(value: number, kind: CountKind) {
  if (kind === "rupees") return formatRupees(Math.round(value));
  if (kind === "percent") return `${Math.round(value)}%`;
  return Math.round(value).toLocaleString("en-IN");
}

/**
 * A number that counts up from 0 when it appears (Analytics' tiles and
 * hero). The server renders the final value, so it's right before JS and
 * under reduced motion; on mount it rolls up over `ms` with an ease-out,
 * writing the text directly (no re-renders). Screen readers get the final
 * value once, from the sr-only copy.
 */
export function CountUp({ value, kind = "int", delay = 0, ms = 1100 }: { value: number; kind?: CountKind; delay?: number; ms?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const text = format(value, kind);

  useEffect(() => {
    const el = ref.current;
    if (!el || value === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let start = 0;
    // Drops to 0 on the first frame, not before — a tab whose frames are
    // paused (in the background) keeps showing the real number.
    const tick = (t: number) => {
      if (!start) start = t + delay;
      const p = Math.min(1, Math.max(0, (t - start) / ms));
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = format(value * eased, kind);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.textContent = format(value, kind);
    };
  }, [value, kind, delay, ms]);

  return (
    <>
      <span ref={ref} aria-hidden="true">
        {text}
      </span>
      <span className="sr-only">{text}</span>
    </>
  );
}
