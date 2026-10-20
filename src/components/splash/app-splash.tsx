import type { CSSProperties } from "react";
import { SCENE } from "./scene";
import "./splash.css";

const WORDMARK = { src: "/brand/splash/wordmark.webp", w: 1123, h: 240 };
const TAGLINE = { src: "/brand/splash/tagline.webp", w: 920, h: 30 };

/* Sparkles round the cloche on the burst (hero %: left, top, size). */
const SPARKLES = [
  [8, 22, 9],
  [86, 14, 11],
  [92, 52, 7],
  [2, 58, 6],
] as const;

/**
 * The startup splash, "The Cloche Reveal" (20 Oct 2026): on a deep plum
 * stage the closed gold cloche rises and settles, shakes once as if
 * something's inside, then bursts open in a flash of warm light and steam —
 * and the mascot is there, waving (a 12-frame strip from a Veo clip, built
 * by scripts/build-splash.mjs with the cloche and steam art). "MuteBites"
 * sweeps in in gold, the tagline follows, and the whole thing closes into
 * the page's logo tile. All motion is ./engine.ts, run by the inline script
 * in the root layout; this is only markup, hidden until that script decides
 * this load plays it. Decorative throughout (aria-hidden).
 *
 * Images are `loading="lazy"` / CSS backgrounds on purpose: when the splash
 * is skipped it's `display: none` and they never download; when it plays,
 * the engine has already preloaded them.
 */
export function AppSplash() {
  const { pop, cloche, steam } = SCENE;
  return (
    <div id="app-splash" className="app-splash" aria-hidden="true">
      <span className="sp-spot" data-sp="spot" />
      <div className="sp-stage" data-sp="stage">
        <div className="sp-hero" data-sp="hero" style={{ aspectRatio: `${pop.w} / ${pop.h}` }}>
          <span className="sp-shadow" data-sp="shadow" />
          <span className="sp-glow" data-sp="glow" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="sp-steam left"
            data-sp="steam"
            src={steam.src}
            alt=""
            loading="lazy"
            draggable={false}
            style={{ aspectRatio: `${steam.w} / ${steam.h}` }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="sp-steam right"
            data-sp="steam"
            src={steam.src}
            alt=""
            loading="lazy"
            draggable={false}
            style={{ aspectRatio: `${steam.w} / ${steam.h}` }}
          />
          {/* The waving strip, moved by transform (GPU) — never by
              background-position, which repaints every frame. At rest it
              shows the last frame. */}
          <span className="sp-pop" data-sp="pop">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="sp-strip"
              data-sp="strip"
              src={pop.src}
              alt=""
              loading="lazy"
              draggable={false}
              style={{
                width: `${pop.frames * 100}%`,
                transform: `translateX(${(-((pop.frames - 1) / pop.frames) * 100).toFixed(4)}%)`,
              }}
            />
          </span>
          <div
            className="sp-cloche"
            data-sp="cloche"
            style={{
              left: `${pop.tray.left * 100}%`,
              width: `${pop.tray.width * 100}%`,
              aspectRatio: `${cloche.w} / ${cloche.h}`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cloche.src} alt="" loading="lazy" draggable={false} />
          </div>
          <span className="sp-flash" data-sp="flash" />
          {SPARKLES.map(([left, top, size], i) => (
            <svg
              key={i}
              className="sp-sparkle"
              data-sp="sparkle"
              viewBox="0 0 10 10"
              style={{ left: `${left}%`, top: `${top}%`, width: `${size}%` }}
            >
              <path d="M5 0q.6 4.4 5 5q-4.4.6-5 5q-.6-4.4-5-5q4.4-.6 5-5z" fill="#ffe4b0" />
            </svg>
          ))}
        </div>
        {/* The wipe is two opposite translates (the window slides in from
            the left, the word inside slides back), not a clip-path. */}
        <span className="sp-wipe" data-sp="wipe">
          <span
            className="sp-word"
            data-sp="wordmark"
            style={{ aspectRatio: `${WORDMARK.w} / ${WORDMARK.h}`, "--mask": `url(${WORDMARK.src})` } as CSSProperties}
          >
            <span className="sp-shine" data-sp="shine" />
          </span>
        </span>
        <span
          className="sp-tagline"
          data-sp="tagline"
          style={{ aspectRatio: `${TAGLINE.w} / ${TAGLINE.h}`, "--mask": `url(${TAGLINE.src})` } as CSSProperties}
        />
      </div>
    </div>
  );
}

/** Every image the splash needs, for the engine to preload. */
export const SPLASH_IMAGES = [SCENE.pop.src, SCENE.cloche.src, SCENE.steam.src, WORDMARK.src, TAGLINE.src];
