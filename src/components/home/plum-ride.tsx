import type { CSSProperties } from "react";
import { PlumSceneLive } from "./plum-scene-live";
import "./plum-ride.css";

/*
 * MuteBites Plum's promo scene (18 Oct 2026; replaced the campus-run PlumScene).
 * "On the way to you": the camera rides alongside the mascot. It sits big on
 * the right, riding in place (plum-ride-rider.webp: 16 frames at 12 fps, cut
 * from the side-on Veo loop by scripts/build-rider-strips.mjs), while three
 * painted layers scroll past at different speeds — sunset sky, the campus
 * skyline with the clock tower, roadside lamps and trees — over the road's
 * dashes, and every few seconds a "Main Gate" sign rides past with the
 * delivery time. Sources in docs/art/plum-promo/new/ride/. Each layer is two
 * tiles wide and slides exactly one tile, so the loop never jumps. Paused
 * off screen / under the splash ([data-on]); reduced motion = still.
 */
export function PlumRide({ time }: { time: string }) {
  return (
    <div aria-hidden="true" className="ride-scene absolute inset-0">
      <PlumSceneLive />
      <span className="ride-layer ride-sky" />
      <span className="ride-sun" />
      <span className="ride-layer ride-skyline" />
      <span className="ride-layer ride-roadside" />

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
        </span>
      </div>
    </div>
  );
}
