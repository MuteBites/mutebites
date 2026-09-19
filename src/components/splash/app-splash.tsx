import type { CSSProperties } from "react";
import { SPLASH } from "./config";
import { LAYERS, STAGE_ASPECT, type LayerName } from "./layers";

/**
 * The startup splash: the transparent logo cut into layers
 * (scripts/build-brand-assets.mjs) and re-assembled on a warm ivory
 * screen, so the mascot can run in, land, lift its cloche and let the
 * wordmark and tagline arrive after it.
 *
 * Pure markup — rendered once in the root layout, hidden by default. The
 * head script in ./init-script.ts decides whether this load plays it and
 * drives it via `data-splash` on <html>; all motion is the "Startup
 * splash" CSS in globals.css. Decorative throughout (aria-hidden): the
 * page underneath is fully in the accessibility tree the whole time.
 *
 * Layer images are `loading="lazy"` on purpose: when the splash is skipped
 * it's `display: none`, and lazy images that are never laid out never
 * download. When it plays, the head script has already preloaded them.
 */
export function AppSplash() {
  return (
    <div
      id="app-splash"
      className="app-splash splash-fade"
      aria-hidden="true"
      style={
        {
          "--sp-speed": SPLASH.speed,
          "--sp-run-from": SPLASH.runFrom,
          "--sp-bounce": SPLASH.bounce,
          "--sp-steam": `${SPLASH.steamMs}ms`,
          "--sp-aspect": STAGE_ASPECT,
        } as CSSProperties
      }
    >
      <div className="sp-stage splash-fade">
        <div className="sp-run sp-fill">
          <div className="sp-land sp-fill">
            <div className="sp-lean sp-fill">
              <div className="sp-bob sp-fill">
                <Layer name="trails" className="sp-trails" />
                <Layer name="mascot" />
                <span className="sp-glow" />
                <Layer name="lid" className="sp-lid" />
                <Layer name="steam" className="sp-steam" />
                <svg className="sp-wisps" viewBox="0 0 130 120" fill="none">
                  <path d="M18 118C8 100 30 88 20 70S10 44 22 28" stroke="#d7a8b8" />
                  <path d="M112 116C102 98 124 86 114 68S104 44 116 30" stroke="#914955" strokeOpacity="0.45" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <Layer name="swoosh" className="sp-swoosh" />
        <Layer name="wordmark" className="sp-wordmark" />
        <Layer name="tagline" className="sp-tagline" />
      </div>
    </div>
  );
}

function Layer({ name, className }: { name: LayerName; className?: string }) {
  const l = LAYERS[name];
  return (
    <div
      className={className ? `sp-layer ${className}` : "sp-layer"}
      style={{ left: `${l.left}%`, top: `${l.top}%`, width: `${l.width}%`, height: `${l.height}%` }}
    >
      {/* Plain <img>: fixed, pre-sized WebP layers that must be byte-identical
          to what the head script preloads — no optimizer URL rewriting. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={l.src} alt="" loading="lazy" fetchPriority="high" draggable={false} />
    </div>
  );
}
