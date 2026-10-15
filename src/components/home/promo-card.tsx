import type { CSSProperties } from "react";
import Image from "next/image";
import { Banknote, Clock, MapPin } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

/**
 * Home's promo card, shown while ordering is open (when it's closed, the
 * "Ordering is closed" banner takes this spot). Both palettes' versions are
 * in the markup; the nearest data-palette shows one (only-plum /
 * only-kaapi), so it's right before hydration, and the hidden one's images
 * are never fetched (lazy + display: none).
 *
 *   MuteBites Plum  the pitch, the real delivery time an order placed now
 *                   gets (deliveryWindow(), passed in from the server so it
 *                   can't disagree with the ticket), two chips, and the
 *                   mascot's ivory tile floating on the right.
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
        className="only-plum surface-hero glow-hero relative mt-6 overflow-hidden rounded-[1.75rem] bg-hero p-5 pr-28 text-hero-foreground"
      >
        {/* Warm light behind the mascot. */}
        <span
          aria-hidden="true"
          className="absolute top-1/2 -right-6 size-40 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,var(--promo-light),transparent)]"
        />
        <h2 className="relative font-heading text-title font-bold">Hot food, at Main Gate</h2>
        <p className="relative mt-1 text-sm text-hero-foreground/85">Order here, pay when you collect.</p>
        <p className="relative mt-3 flex items-center gap-1.5 text-sm font-semibold">
          <Clock className="size-4 shrink-0 text-hero-accent" aria-hidden="true" />
          <span>
            Order now · {slot.lead.toLowerCase()} <span className="text-hero-accent">{slot.time}</span>
          </span>
        </p>
        <ul className="relative mt-3 flex flex-wrap gap-1.5 text-xs font-semibold">
          <li className="inline-flex items-center gap-1 rounded-full bg-hero-foreground/10 px-2.5 py-1">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            Free delivery
          </li>
          <li className="inline-flex items-center gap-1 rounded-full bg-hero-foreground/10 px-2.5 py-1">
            <Banknote className="size-3.5 shrink-0" aria-hidden="true" />
            Cash or UPI
          </li>
        </ul>
        <div aria-hidden="true" className="absolute top-1/2 right-4 -translate-y-1/2">
          <div className="animate-float">
            <BrandLogo className="size-20 rotate-6 rounded-3xl shadow-raised ring-2 ring-hero-foreground/15" />
          </div>
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
