"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { afterSplash } from "@/components/splash/after-splash";
import { cn } from "@/lib/utils";

// The two handwriting faces (layout.tsx), alternating.
const FACES = ["var(--font-love-light)", "var(--font-grey-qo)"];
// Per letter: the pen traces its outline, then the ink fills in.
const LETTER_MS = 170;
const STROKE_MS = 520;
const FILL_MS = 260;
const HOLD_MS = 3200;
const ERASE_MS = 500;

type Phase = "rest" | "write" | "erase";

/**
 * The student's name, handwritten (MuteBites Plum): letter by letter the
 * pen traces each glyph's outline and the ink floods in behind it, like a
 * whiteboard drawing; it holds, lifts off, and is written again in the
 * other face — Love Light ⇄ Grey Qo. Each word is an inline SVG laid over an
 * invisible copy of itself (so wrapping and size come from normal text);
 * strokes animate stroke-dashoffset on the SVG text's own outlines.
 * `tone`: "heading" = Home's ink → rose → amber gradient, "hero" = the light
 * text on the lit plum pass. Starts after the splash; reduced motion = the
 * plain name in the first face. Desi Kaapi shows it in its heading font
 * (`.script-name` rules in globals.css).
 */
export function ScriptName({
  text,
  tone = "heading",
  className,
}: {
  text: string;
  tone?: "heading" | "hero";
  className?: string;
}) {
  const [face, setFace] = useState(0);
  const [phase, setPhase] = useState<Phase>("rest");
  const words = text.trim().split(/\s+/);
  const letters = words.join("").length;
  const writeMs = (letters - 1) * LETTER_MS + STROKE_MS + FILL_MS;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    let stopped = false;
    const wait = (ms: number, next: () => void) => {
      timer = window.setTimeout(() => !stopped && next(), ms);
    };
    function write() {
      setPhase("write");
      wait(writeMs + HOLD_MS, () => {
        setPhase("erase");
        wait(ERASE_MS, () => {
          setFace((f) => (f + 1) % FACES.length);
          write();
        });
      });
    }
    // Fonts first, so the outlines are measured in the right face.
    const cancelSplash = afterSplash(() => {
      document.fonts.ready.then(() => !stopped && wait(400, write));
    });
    return () => {
      stopped = true;
      cancelSplash();
      window.clearTimeout(timer);
    };
  }, [writeMs]);

  // Each word's first letter index, so the letter delays run on across words.
  const starts = words.map((_, w) => words.slice(0, w).join("").length);
  return (
    <span
      className={cn("script-name", className)}
      data-phase={phase}
      data-tone={tone}
      style={{ fontFamily: FACES[face] }}
    >
      <span className="sr-only">{text}</span>
      {words.map((word, w) => (
        <span key={w}>
          {w > 0 && " "}
          <ScriptWord key={`${face}-${w}`} word={word} start={starts[w]} />
        </span>
      ))}
    </span>
  );
}

/** One word: an invisible text copy for layout, the drawn SVG on top. */
function ScriptWord({ word, start }: { word: string; start: number }) {
  const gradient = useId();
  const sizer = useRef<HTMLSpanElement>(null);
  const [box, setBox] = useState<{ w: number; h: number; base: number } | null>(null);

  // Measure the word and its baseline; again whenever it reflows (a font
  // finishing loading, a resize).
  useLayoutEffect(() => {
    const el = sizer.current;
    if (!el) return;
    const measure = () => {
      const mark = el.lastElementChild as HTMLElement | null;
      setBox({ w: el.offsetWidth, h: el.offsetHeight, base: mark ? mark.offsetTop : el.offsetHeight * 0.8 });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <span className="script-word">
      <span ref={sizer} aria-hidden="true" className="script-sizer">
        {word}
        {/* Zero-size marker sitting on the baseline. */}
        <span className="script-baseline" />
      </span>
      {box && (
        <svg
          aria-hidden="true"
          className="script-svg"
          width={box.w}
          height={box.h}
          viewBox={`0 0 ${box.w} ${box.h}`}
        >
          <defs>
            <linearGradient id={gradient} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" className="script-stop-a" />
              <stop offset="50%" className="script-stop-b" />
              <stop offset="100%" className="script-stop-c" />
            </linearGradient>
          </defs>
          <text x="0" y={box.base} className="script-text" style={{ "--script-ink": `url(#${gradient})` } as CSSProperties}>
            {[...word].map((ch, i) => (
              <tspan key={i} className="script-letter" style={{ "--i": start + i } as CSSProperties}>
                {ch}
              </tspan>
            ))}
          </text>
        </svg>
      )}
    </span>
  );
}
