import type { CSSProperties } from "react";
import { PlumSceneLive } from "./plum-scene-live";
import "./plum-ride.css";

/*
 * PROTOTYPE (18 Oct 2026), shown only with ?promo=new — see PlumPromoChooser.
 * "On the way to you": the camera rides alongside the mascot. It sits big on
 * the right, riding in place (the existing 12 fps "riding right" strip),
 * while four layers scroll past at different speeds — sky and sun, the
 * campus skyline with the clock tower, roadside lamps and trees, the road's
 * dashes — and every few seconds a "Main Gate" sign rides past with the
 * delivery time. The skyline and roadside are drawn stand-ins until the
 * generated layers arrive (docs/art/plum-promo/ride/). All CSS motion, each
 * layer a 200%-wide strip that loops by sliding exactly half its width.
 * Paused off screen / under the splash ([data-on]); reduced motion = still.
 */

/* One tile (100 × 40 units) of the skyline; drawn twice side by side. */
function SkylineTile({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <path d="M0 40V27h7v-4h6v4h5v-9h9v9h4v-6h8v6h3V12l3-4 3 4v15h4v-7h10v7h5v-5h7v5h4v-11h8v11h7V40z" />
      {/* Clock tower: a face and a spire. */}
      <circle cx="43" cy="16" r="1.6" className="ride-clock" />
      <path d="M41 8l2-6 2 6z" />
      {[
        [21, 22],
        [24, 25],
        [36, 24],
        [62, 23],
        [85, 25],
        [89, 22],
      ].map(([wx, wy]) => (
        <rect key={`${wx}-${wy}`} x={wx} y={wy} width="1.4" height="1.6" className="ride-window" />
      ))}
    </g>
  );
}

/* One tile of the roadside: two lamps and a tree on a low wall. */
function RoadsideTile({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <rect x="0" y="34" width="100" height="6" />
      {[18, 68].map((lx) => (
        <g key={lx}>
          <rect x={lx} y="6" width="1.2" height="28" />
          <path d={`M${lx - 3} 7h7.2v1.4h-7.2z`} />
          <circle cx={lx + 3.4} cy="9.2" r="1.3" className="ride-lamp" />
        </g>
      ))}
      <rect x="43" y="22" width="1.6" height="12" />
      <circle cx="43.8" cy="18" r="6.5" />
      <circle cx="39.5" cy="21" r="4.5" />
      <circle cx="48" cy="21" r="4.5" />
    </g>
  );
}

export function PlumRide({ time }: { time: string }) {
  return (
    <div aria-hidden="true" className="ride-scene absolute inset-0">
      <PlumSceneLive />
      <span className="ride-sky" />
      <span className="ride-sun" />
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny, decorative */}
      <img src="/photos/promo/plum-cloud-a.webp" alt="" className="ride-cloud a" />
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny, decorative */}
      <img src="/photos/promo/plum-cloud-b.webp" alt="" className="ride-cloud b" />

      <svg viewBox="0 0 200 40" preserveAspectRatio="none" className="ride-layer ride-skyline">
        <SkylineTile x={0} />
        <SkylineTile x={100} />
      </svg>
      <svg viewBox="0 0 200 40" preserveAspectRatio="none" className="ride-layer ride-roadside">
        <RoadsideTile x={0} />
        <RoadsideTile x={100} />
      </svg>

      {/* The sign rides past on the roadside, behind the mascot. */}
      <div className="ride-sign">
        <span className="ride-sign-board">
          Main Gate <b>{time}</b>
        </span>
        <span className="ride-sign-post" />
      </div>

      <span className="ride-road" />
      {/* Keeps the copy on the left readable over whatever scrolls past. */}
      <span className="ride-scrim" />

      <div className="ride-rider">
        <span className="ride-beam" />
        <span className="ride-shadow" />
        <svg viewBox="0 0 40 30" className="ride-streaks">
          <line x1="4" y1="8" x2="34" y2="8" style={{ "--d": "0s" } as CSSProperties} />
          <line x1="0" y1="16" x2="30" y2="16" style={{ "--d": "0.25s" } as CSSProperties} />
          <line x1="8" y1="24" x2="36" y2="24" style={{ "--d": "0.5s" } as CSSProperties} />
        </svg>
        <span className="ride-bob">
          <span className="ride-sprite" />
          {/* A puff of steam off the food box now and then. */}
          <span className="ride-steam">
            <i />
            <i />
            <i />
          </span>
        </span>
      </div>
    </div>
  );
}
