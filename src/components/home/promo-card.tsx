import type { CSSProperties } from "react";
import Image from "next/image";
import { Clock, MapPin } from "lucide-react";
import { PlumSceneLive } from "./plum-scene-live";
import "./plum-promo.css";
import "./plum-promo-route.css";

/**
 * Home's promo card, shown while ordering is open (when it's closed, the
 * "Ordering is closed" banner takes this spot). Both palettes' versions are
 * in the markup; the nearest data-palette shows one (only-plum /
 * only-kaapi), so it's right before hydration, and the hidden one's images
 * are never fetched (lazy + display: none).
 *
 *   MuteBites Plum  the pitch and the real delivery time an order placed
 *                   now gets (deliveryWindow(), passed in from the server so
 *                   it can't disagree with the ticket) over Plum's own
 *                   scene (PlumScene, 18 Oct 2026): a campus at sunset and
 *                   the mascot's delivery from the clock tower to you — it
 *                   rides the far lane behind the bushes, takes the hairpin
 *                   and the bend, comes towards you and brakes right of the
 *                   text, then waves; birds, fireflies, drifting clouds,
 *                   window lights and the sun glow around it. Details in
 *                   plum-promo.css; reduced motion shows it waving.
 *   Desi Kaapi      College Bites' promo exactly: the line and one sentence
 *                   on the left, and on the right the Kaapi campus scene
 *                   with a delivery run looping every 9 s — the rider pulls
 *                   in, idles, rides the road's S-bend up to the campus
 *                   (shrinking with distance, speed lines and a puff of
 *                   dust while moving), rides in, and the pin pops with a
 *                   ring and a burst; steam rises off the food box. All CSS
 *                   (`promo-*` in globals.css); reduced motion parks the
 *                   rider at the foot of the road.
 */
export function PromoCard({ slot }: { slot: { lead: string; time: string } }) {
  return (
    <>
      <section
        aria-label="Hot food, at Main Gate"
        className="only-plum surface-hero glow-hero @container relative mt-6 min-h-[13.5rem] overflow-hidden rounded-[1.75rem] bg-hero p-5 text-hero-foreground"
      >
        <PlumScene />
        <div className="relative z-10 max-w-[52%] [text-shadow:0_1px_10px_rgb(58_27_49/0.55)] @[20rem]:max-w-[56%]">
          <h2 className="font-heading text-title leading-tight font-bold">Hot food, at Main&nbsp;Gate</h2>
          <p className="mt-1 text-sm text-hero-foreground/85">Order here, pay when you collect.</p>
          <p className="mt-2.5 flex items-start gap-1.5 text-sm font-semibold">
            <Clock className="mt-0.5 size-4 shrink-0 text-hero-accent" aria-hidden="true" />
            {/* Short on purpose: the rider rides the road just right of this. */}
            <span>
              {slot.lead} <span className="text-hero-accent">{slot.time}</span>
            </span>
          </p>
        </div>
      </section>

      <section
        aria-label="Hot food, at Main Gate"
        className="only-kaapi surface-hero glow-hero relative mt-5 min-h-44 overflow-hidden rounded-[1.75rem] bg-hero p-5 text-hero-foreground"
      >
        <div className="relative z-10 max-w-[62%]">
          <h2 className="font-heading text-title leading-tight font-bold">Hot food, at Main&nbsp;Gate</h2>
          <p className="mt-1.5 max-w-[7.5rem] text-sm font-medium">Order here, pay when you collect.</p>
        </div>
        <KaapiScene />
      </section>
    </>
  );
}

/* Arrival burst around the pin's head (scene viewBox 100 × 61). */
const BURST = [
  [0, -7],
  [6, -4],
  [7, 2],
  [-6, -4],
  [-7, 2],
  [0, 6],
] as const;

/** College Bites' Kaapi scene and delivery run (public/photos/promo/kaapi-*.webp). */
function KaapiScene() {
  return (
    <div aria-hidden="true" className="promo-scene absolute -right-3 -bottom-2 aspect-[1476/906] w-[74%]">
      <Image
        src="/photos/promo/kaapi-scene.webp"
        alt=""
        fill
        sizes="(max-width: 448px) 74vw, 320px"
        className="object-contain"
      />

      {/* The pin on the tower's door (white halo so it reads on the dark
          doorway). It pops, rings and bursts the moment the rider rides in. */}
      <span className="promo-pin absolute top-[35%] left-[60%] flex w-[10%] flex-col items-center">
        <MapPin
          fill="currentColor"
          stroke="white"
          strokeWidth={1.5}
          className="size-full text-hero-foreground [filter:drop-shadow(0_0_1px_rgb(255_255_255))_drop-shadow(0_2px_2px_rgb(0_0_0/0.25))]"
        />
        <span className="promo-pin-ring -mt-[18%] h-[14%] w-[70%] rounded-[50%] bg-hero-foreground/30" />
      </span>
      <svg viewBox="0 0 100 61" className="absolute inset-0 size-full overflow-visible text-white">
        {BURST.map(([dx, dy], i) => (
          <circle
            key={i}
            cx="65"
            cy="25.3"
            r="0.9"
            fill="currentColor"
            className="promo-burst"
            style={{ "--dx": `${dx}px`, "--dy": `${dy}px` } as CSSProperties}
          />
        ))}
      </svg>

      {/* The delivery run: .promo-route moves along the road (percentages of
          the scene); .promo-rider sits on it by its wheels and scales with
          distance, flipping to face the way it rides after the bend. */}
      <div className="promo-route absolute inset-0">
        <div className="promo-rider absolute top-0 left-0 w-[26%]">
          <div className="promo-bob relative">
            {/* Ground shadow, under the wheels. */}
            <span className="absolute -bottom-[3%] left-[14%] h-[9%] w-[74%] rounded-[50%] bg-black/25 blur-[2px]" />
            {/* Speed lines behind, while it's moving. */}
            <svg viewBox="0 0 40 30" className="promo-trail absolute top-[42%] -left-[40%] w-[52%] overflow-visible text-hero-foreground">
              <line x1="6" y1="6" x2="34" y2="6" className="promo-streak" style={{ animationDelay: "0s" }} />
              <line x1="0" y1="14" x2="30" y2="14" className="promo-streak" style={{ animationDelay: "0.3s" }} />
              <line x1="10" y1="22" x2="36" y2="22" className="promo-streak" style={{ animationDelay: "0.6s" }} />
            </svg>
            {/* Dust kicked up by the back wheel as it pulls away. */}
            <span className="promo-dust absolute bottom-[2%] left-[4%] size-[16%] rounded-full bg-white/70" />
            <span className="promo-dust promo-dust-2 absolute bottom-[8%] -left-[6%] size-[11%] rounded-full bg-white/60" />
            <Image
              src="/photos/promo/kaapi-rider.webp"
              alt=""
              width={520}
              height={505}
              sizes="(max-width: 448px) 26vw, 120px"
              className="relative h-auto w-full"
            />
            {/* Steam off the food box. */}
            <svg viewBox="0 0 24 24" className="absolute -top-[18%] left-[6%] w-[30%] text-white">
              <path d="M8 20c-2-3 2-5 0-8s2-5 0-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="motif-steam" />
              <path d="M15 20c-2-3 2-5 0-8s2-5 0-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="motif-steam" style={{ animationDelay: "1.2s" }} />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Plum's frame strips (scripts/build-rider-strips.mjs): frames per strip and
   each frame's width at the strips' 160 px height. */
const PLUM_STRIPS = {
  left: { n: 15, w: 168 },
  right: { n: 18, w: 151 },
  approach: { n: 17, w: 123 },
  arrive: { n: 15, w: 125 },
} as const;

const strip = (pose: keyof typeof PLUM_STRIPS): CSSProperties =>
  ({
    "--n": PLUM_STRIPS[pose].n,
    "--strip": `url(/photos/promo/plum-rider-${pose}.webp)`,
    aspectRatio: `${PLUM_STRIPS[pose].w} / 160`,
  }) as CSSProperties;

/* Window lights (scene %: left, top, width). */
const PLUM_GLOWS = [
  [75.5, 57, 8],
  [75.5, 39.7, 5],
  [60, 53, 16],
  [90, 58, 14],
] as const;
/* Arrival sparkles round the rider (box %: left, top, width). */
const PLUM_SPARKLES = [
  [12, 8, 12],
  [78, 2, 14],
  [86, 30, 9],
  [6, 34, 8],
] as const;
/* Fireflies over the bushes (scene %). */
const PLUM_FLIES = [
  [46, 72],
  [56, 63],
  [82, 63],
  [92, 71],
  [63, 59],
  [69, 66],
] as const;

/**
 * Plum's campus scene and delivery (plum-promo.css, plum-promo-route.css,
 * public/photos/promo/plum-*.webp; built from docs/art/plum-promo/).
 */
function PlumScene() {
  return (
    <div aria-hidden="true" className="promo-scene plum-scene absolute inset-x-0 bottom-0 aspect-[1200/736] w-full">
      <PlumSceneLive />
      <span className="plum-sun" />
      <Image
        src="/photos/promo/plum-scene-v2.webp"
        alt=""
        fill
        sizes="(max-width: 448px) 100vw, 400px"
        unoptimized
        className="object-contain"
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny, decorative, positioned in scene % */}
      <img src="/photos/promo/plum-cloud-a.webp" alt="" className="plum-cloud-a" />
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny, decorative, positioned in scene % */}
      <img src="/photos/promo/plum-cloud-b.webp" alt="" className="plum-cloud-b" />
      {PLUM_GLOWS.map(([left, top, width]) => (
        <span key={`${left}-${top}`} className="plum-glow" style={{ left: `${left}%`, top: `${top}%`, width: `${width}%` }} />
      ))}
      <svg viewBox="0 0 44 20" className="plum-birds">
        <g className="flock" fill="none" stroke="rgb(255 248 242 / 75%)" strokeWidth="0.5" strokeLinecap="round">
          <path className="wing" d="M10 6q1.5-1.6 3 0q1.5-1.6 3 0" />
          <path className="wing" d="M17 9q1.2-1.3 2.4 0q1.2-1.3 2.4 0" />
          <path className="wing" d="M6 10q1-1.1 2 0q1-1.1 2 0" />
        </g>
      </svg>
      <div className="plum-full">
        {PLUM_FLIES.map(([left, top]) => (
          <span key={`${left}-${top}`} className="plum-fly absolute" style={{ left: `${left}%`, top: `${top}%` }} />
        ))}
      </div>
      {/* The bushes in front of the far lane: the rider passes behind them. */}
      <Image
        src="/photos/promo/plum-front-bushes.webp"
        alt=""
        fill
        sizes="(max-width: 448px) 100vw, 400px"
        unoptimized
        className="plum-bushes object-contain"
      />
      <span className="plum-dust hairpin" />
      <span className="plum-dust bend" />
      <div className="plum-track">
        <div className="plum-pos">
          <div className="plum-anchor">
            <div className="plum-size">
              <div className="plum-fade">
                <div className="plum-brake">
                  <div className="plum-turn">
                    <div className="plum-box">
                      <span className="plum-shadow" />
                      <div className="plum-pose left">
                        <span className="plum-sprite" style={strip("left")} />
                      </div>
                      <div className="plum-pose right">
                        <span className="plum-sprite" style={strip("right")} />
                      </div>
                      <div className="plum-pose front">
                        <span className="plum-sprite approach" style={strip("approach")} />
                        <span className="plum-sprite arrive" style={strip("arrive")} />
                        {/* The headlight, lit while it comes towards you. */}
                        <span className="plum-headlight" />
                      </div>
                      {/* Arrival: a ding of sparkles round the mascot's head. */}
                      {PLUM_SPARKLES.map(([left, top, size], i) => (
                        <svg
                          key={i}
                          viewBox="0 0 10 10"
                          className="plum-sparkle"
                          style={{ left: `${left}%`, top: `${top}%`, width: `${size}%`, animationDelay: `${i * 0.12}s` }}
                        >
                          <path d="M5 0q.6 4.4 5 5q-4.4.6-5 5q-.6-4.4-5-5q4.4-.6 5-5z" fill="#ffe4b0" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
