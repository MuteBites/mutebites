import type { CSSProperties } from "react";
import Image from "next/image";
import { Clock, MapPin } from "lucide-react";

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
 *                   scene (17 Oct 2026, generated art cleaned of its edge
 *                   fringe): a campus at sunset, the mascot on its scooter.
 *                   The 9 s run: it pulls in facing you on the stretch of
 *                   road right of the text (the left of the road would sit
 *                   under the delivery time), pauses, turns side on and
 *                   rides the S-curve (round the bend facing left,
 *                   then right up to the tower), shrinking with distance;
 *                   the pin pops at the tower door; the sun breathes and
 *                   the doorway flickers warm (`plum-scene-*` in
 *                   globals.css, sharing Kaapi's trail / dust / bob / pin /
 *                   burst timings). Reduced motion parks it where it pulls
 *                   in, facing you.
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

/* Plum's arrival burst, round the pin on the tower door (viewBox 100 × 61). */
const PLUM_PIN = { cx: 74.9, cy: 30.5 };

/** Plum's campus scene and delivery run (public/photos/promo/plum-*.webp). */
function PlumScene() {
  return (
    <div aria-hidden="true" className="promo-scene absolute inset-x-0 bottom-0 aspect-[1200/736] w-full">
      {/* The sun breathing, and the tower's lit doorway. */}
      <span className="plum-scene-sun absolute top-[43.8%] left-[89%] aspect-square w-[34%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(246_210_164/0.55),transparent)]" />
      <Image
        src="/photos/promo/plum-scene.webp"
        alt=""
        fill
        sizes="(max-width: 448px) 100vw, 400px"
        className="object-contain"
      />
      <span className="plum-scene-door absolute top-[57%] left-[75.5%] aspect-square w-[9%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_214_150/0.8),transparent)]" />

      <span className="promo-pin absolute top-[45%] left-[70.4%] flex w-[9%] flex-col items-center">
        <MapPin
          fill="currentColor"
          stroke="white"
          strokeWidth={1.5}
          className="size-full text-hero-accent [filter:drop-shadow(0_2px_2px_rgb(0_0_0/0.3))]"
        />
        <span className="promo-pin-ring -mt-[18%] h-[14%] w-[70%] rounded-[50%] bg-hero-foreground/30" />
      </span>
      <svg viewBox="0 0 100 61" className="absolute inset-0 size-full overflow-visible text-white">
        {BURST.map(([dx, dy], i) => (
          <circle
            key={i}
            cx={PLUM_PIN.cx}
            cy={PLUM_PIN.cy}
            r="0.9"
            fill="currentColor"
            className="promo-burst"
            style={{ "--dx": `${dx}px`, "--dy": `${dy}px` } as CSSProperties}
          />
        ))}
      </svg>

      {/* The run: .plum-scene-route moves along the road (scene percentages);
          the rider sits on it by its wheels, scales with distance and flips
          to face the way it rides. The front view shows while it pulls in. */}
      <div className="plum-scene-route absolute inset-0">
        <div className="plum-scene-rider absolute top-0 left-0 w-[20%]">
          <div className="promo-bob relative">
            <span className="absolute -bottom-[3%] left-[14%] h-[8%] w-[74%] rounded-[50%] bg-black/30 blur-[2px]" />
            <svg viewBox="0 0 40 30" className="promo-trail absolute top-[40%] -left-[42%] w-[52%] overflow-visible text-hero-foreground">
              <line x1="6" y1="6" x2="34" y2="6" className="promo-streak" style={{ animationDelay: "0s" }} />
              <line x1="0" y1="14" x2="30" y2="14" className="promo-streak" style={{ animationDelay: "0.3s" }} />
              <line x1="10" y1="22" x2="36" y2="22" className="promo-streak" style={{ animationDelay: "0.6s" }} />
            </svg>
            <span className="promo-dust absolute bottom-[2%] left-[4%] size-[16%] rounded-full bg-white/70" />
            <span className="promo-dust promo-dust-2 absolute bottom-[8%] -left-[6%] size-[11%] rounded-full bg-white/60" />
            <Image
              src="/photos/promo/plum-rider.webp"
              alt=""
              width={360}
              height={366}
              sizes="(max-width: 448px) 20vw, 90px"
              className="plum-scene-side relative h-auto w-full"
            />
            <Image
              src="/photos/promo/plum-rider-front.webp"
              alt=""
              width={360}
              height={466}
              sizes="(max-width: 448px) 18vw, 80px"
              className="plum-scene-front absolute bottom-0 left-[8%] h-auto w-[84%]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
