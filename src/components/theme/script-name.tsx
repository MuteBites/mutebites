"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { afterSplash } from "@/components/splash/after-splash";
import { toTelugu } from "@/lib/telugu";
import { usePalette } from "@/lib/theme/store";
import { cn } from "@/lib/utils";

// The three handwriting faces (layout.tsx), in turn.
const FACES = ["var(--font-love-light)", "var(--font-grey-qo)", "var(--font-sirivennela)"];
// Sirivennela writes the name in Telugu (toTelugu), one word at a time.
const TELUGU_FACE = 2;
// Per letter: the pen traces its outline, then the ink fills in.
const LETTER_MS = 170;
const STROKE_MS = 520;
// Telugu is revealed a whole word at a time, as plain HTML text (see
// TeluguWord): each word wipes in, WORD_MS after the one before.
const WORD_MS = 420;
const WORD_WIPE_MS = 760;
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
  const palette = usePalette();
  const [face, setFace] = useState(0);
  const [phase, setPhase] = useState<Phase>("rest");
  // Per face, the words to draw, each split into the units drawn one at a
  // time: letters in English; in Telugu (TELUGU_FACE) each WORD is one unit
  // — Safari shapes every SVG tspan on its own, so splitting a Telugu word
  // tore its vowel signs off their letters (dotted circles).
  const english = text.trim().split(/\s+/);
  const telugu = toTelugu(text).split(/\s+/);
  const wordsFor = (f: number) => (f === TELUGU_FACE ? telugu.map((w) => [w]) : english.map((w) => [...w]));
  const units = wordsFor(face);
  const unitCount = (f: number) => wordsFor(f).flat().length;
  const countKey = FACES.map((_, f) => unitCount(f)).join(",");

  useEffect(() => {
    // Desi Kaapi shows the plain name in its heading font: nothing to draw.
    if (palette === "kaapi") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const counts = countKey.split(",").map(Number);
    let timer = 0;
    let stopped = false;
    let current = 0;
    // Only draw the Telugu turn once its font (Telugu glyphs) has loaded —
    // never in a fallback face. Asked for up front; skipped until it's in.
    let teluguReady = false;
    const probe = document.createElement("span");
    probe.style.fontFamily = FACES[TELUGU_FACE];
    document.body.appendChild(probe);
    const family = getComputedStyle(probe).fontFamily;
    probe.remove();
    document.fonts
      .load(`1em ${family}`, "నాగ")
      .then((faces) => {
        teluguReady = faces.length > 0;
      })
      .catch(() => {});
    const wait = (ms: number, next: () => void) => {
      timer = window.setTimeout(() => !stopped && next(), ms);
    };
    function write() {
      setPhase("write");
      const writeMs =
        current === TELUGU_FACE
          ? (counts[current] - 1) * WORD_MS + WORD_WIPE_MS
          : (counts[current] - 1) * LETTER_MS + STROKE_MS + FILL_MS;
      wait(writeMs + HOLD_MS, () => {
        setPhase("erase");
        wait(ERASE_MS, () => {
          current = (current + 1) % FACES.length;
          if (current === TELUGU_FACE && !teluguReady) current = (current + 1) % FACES.length;
          setFace(current);
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
      setFace(0);
      setPhase("rest");
    };
  }, [countKey, palette]);

  // Each word's first unit index, so the delays run on across words.
  const starts = units.map((_, w) => units.slice(0, w).flat().length);
  return (
    <span
      className={cn("script-name", className)}
      data-phase={phase}
      data-tone={tone}
      style={{ fontFamily: FACES[face] }}
      lang={face === TELUGU_FACE ? "te" : undefined}
    >
      <span className="sr-only">{text}</span>
      {units.map((parts, w) => (
        <span key={w}>
          {w > 0 && " "}
          {face === TELUGU_FACE ? (
            <TeluguWord key={`${face}-${w}`} word={parts.join("")} index={w} />
          ) : (
            <ScriptWord key={`${face}-${w}`} parts={parts} start={starts[w]} />
          )}
        </span>
      ))}
    </span>
  );
}

/**
 * One Telugu word as plain HTML text — never SVG: iPhone Safari lays out
 * Telugu in SVG <text> badly (vowel signs torn off into dotted circles even
 * with the font loaded), while HTML text shapes it perfectly. It wipes in
 * left to right with two opposite translates (the window slides in, the
 * ink inside slides back) — GPU only.
 */
function TeluguWord({ word, index }: { word: string; index: number }) {
  return (
    <span className="script-te" style={{ "--i": index } as CSSProperties}>
      <span className="script-te-ink">{word}</span>
    </span>
  );
}

/** One word: an invisible text copy for layout, the drawn SVG on top. */
function ScriptWord({ parts, start }: { parts: string[]; start: number }) {
  const word = parts.join("");
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
            {parts.map((ch, i) => (
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
