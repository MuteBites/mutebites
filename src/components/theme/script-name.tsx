"use client";

import { useEffect, useState } from "react";
import { afterSplash } from "@/components/splash/after-splash";
import { cn } from "@/lib/utils";

// The three handwriting faces (layout.tsx), written one after another.
const FACES = ["var(--font-love-light)", "var(--font-grey-qo)", "var(--font-sirivennela)"];
const HOLD_MS = 3600;
const ERASE_MS = 450;

/** How long the pen takes to write `text` — longer names write slower. */
function writeMs(text: string) {
  return Math.min(2400, 500 + text.length * 110);
}

/**
 * The student's name, handwritten (MuteBites Plum, 18 Oct 2026): it holds,
 * fades off the page, then is written again left to right in the next face
 * — Love Light → Grey Qo → Sirivennela → … — with a glowing nib running
 * ahead of the ink. Starts after the splash; under reduced motion it stays
 * in the first face. In Desi Kaapi it's plain text in the heading font
 * (`.script-name` rules in globals.css).
 */
export function ScriptName({ text, className }: { text: string; className?: string }) {
  const [face, setFace] = useState(0);
  const [phase, setPhase] = useState<"rest" | "erase" | "write">("rest");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    let stopped = false;
    const wait = (ms: number, next: () => void) => {
      timer = window.setTimeout(() => !stopped && next(), ms);
    };

    function cycle() {
      setPhase("erase");
      wait(ERASE_MS, () => {
        setFace((f) => (f + 1) % FACES.length);
        setPhase("write");
        wait(writeMs(text) + HOLD_MS, cycle);
      });
    }

    const cancelSplash = afterSplash(() => wait(HOLD_MS, cycle));
    return () => {
      stopped = true;
      cancelSplash();
      window.clearTimeout(timer);
    };
  }, [text]);

  return (
    <span
      className={cn("script-name", className)}
      data-phase={phase}
      style={{ "--write-ms": `${writeMs(text)}ms` } as React.CSSProperties}
    >
      <span className="sr-only">{text}</span>
      {/* Re-keyed per face so the write animation runs from the start. */}
      <span key={face} aria-hidden="true" className="script-ink" style={{ fontFamily: FACES[face] }}>
        {text}
      </span>
      {phase === "write" && <span key={`nib-${face}`} aria-hidden="true" className="script-nib" />}
    </span>
  );
}
