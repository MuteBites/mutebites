import type { CSSProperties } from "react";
import {
  Award,
  ChefHat,
  Compass,
  Crown,
  Gift,
  Lock,
  Repeat,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { SUPPORT_PHONE } from "@/lib/support";
import { cn } from "@/lib/utils";

/** "21 Sep", in IST. */
export function formatDayMonth(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

export type MilestoneKey =
  | "first_bite"
  | "regular"
  | "campus_explorer"
  | "campus_foodie"
  | "gate_legend"
  | "centurion";

type MilestoneStats = {
  /** Orders that actually reached the student (status = delivered). */
  deliveredCount: number;
  /** Distinct restaurants among those delivered orders. */
  restaurantsVisited: number;
  /** Restaurants on the platform right now — Campus Explorer needs all of them. */
  totalRestaurants: number;
};

/*
 * Every milestone is derived from counts that only ever go up (delivered
 * orders, distinct restaurants), so a badge never re-locks. The later
 * tiers exist so there's always something visibly locked to aim for —
 * with only three, most regulars had all of them within a couple of weeks.
 */
export const MILESTONES: {
  key: MilestoneKey;
  label: string;
  Icon: LucideIcon;
  /** [current, target] toward unlocking. */
  progress: (s: MilestoneStats) => [number, number];
  /** "19 more orders" etc., shown while locked. */
  remaining: (left: number) => string;
}[] = [
  {
    key: "first_bite",
    label: "First Bite",
    Icon: UtensilsCrossed,
    progress: (s) => [s.deliveredCount, 1],
    remaining: () => "Place your first order",
  },
  {
    key: "regular",
    label: "Regular",
    Icon: Repeat,
    progress: (s) => [s.deliveredCount, 10],
    remaining: (n) => `${n} more ${n === 1 ? "order" : "orders"}`,
  },
  {
    key: "campus_explorer",
    label: "Campus Explorer",
    Icon: Compass,
    progress: (s) => [s.restaurantsVisited, s.totalRestaurants],
    remaining: (n) => `${n} more ${n === 1 ? "restaurant" : "restaurants"}`,
  },
  {
    key: "campus_foodie",
    label: "Campus Foodie",
    Icon: ChefHat,
    progress: (s) => [s.deliveredCount, 25],
    remaining: (n) => `${n} more ${n === 1 ? "order" : "orders"}`,
  },
  {
    key: "gate_legend",
    label: "Gate Legend",
    Icon: Crown,
    progress: (s) => [s.deliveredCount, 50],
    remaining: (n) => `${n} more ${n === 1 ? "order" : "orders"}`,
  },
  {
    key: "centurion",
    label: "Centurion",
    Icon: Award,
    progress: (s) => [s.deliveredCount, 100],
    remaining: (n) => `${n} more ${n === 1 ? "order" : "orders"}`,
  },
];

function isUnlocked([current, target]: [number, number]) {
  return target > 0 && current >= target;
}

/** Shared unlock logic — used both to render the badges and (in profile/page.tsx) to detect a newly-unlocked one to celebrate. */
export function getUnlockedMilestones(
  deliveredCount: number,
  restaurantsVisited: number,
  totalRestaurants: number,
): MilestoneKey[] {
  const stats = { deliveredCount, restaurantsVisited, totalRestaurants };
  return MILESTONES.filter((m) => isUnlocked(m.progress(stats))).map((m) => m.key);
}

export function MilestoneBadges({
  rewardClaimedAt,
  ...stats
}: MilestoneStats & { rewardClaimedAt: string | null }) {
  const tiles = MILESTONES.map((m) => {
    const [current, target] = m.progress(stats);
    return { ...m, current, target, unlocked: isUnlocked([current, target]) };
  });
  const unlockedCount = tiles.filter((t) => t.unlocked).length;
  // The locked milestone you're proportionally closest to.
  const next = tiles
    .filter((t) => !t.unlocked && t.target > 0)
    .sort((a, b) => b.current / b.target - a.current / a.target)[0];

  return (
    <section className="mt-7" aria-labelledby="milestones">
      <div className="flex items-baseline justify-between">
        <h2 id="milestones" className="font-heading text-title font-bold">
          Milestones
        </h2>
        <span className="text-sm font-semibold text-muted-foreground tabular-nums">
          {unlockedCount} of {tiles.length}
        </span>
      </div>
      {next && (
        <p className="mt-0.5 text-sm text-muted-foreground">
          Next up: <span className="font-semibold text-foreground">{next.label}</span> —{" "}
          {next.remaining(Math.max(0, next.target - next.current)).toLowerCase()}
        </p>
      )}
      <ul className="mt-3 grid grid-cols-3 gap-2.5">
        {tiles.map((t) => (
          <li key={t.key}>
            <BadgeTile
              Icon={t.Icon}
              label={t.label}
              unlocked={t.unlocked}
              progress={t.target > 0 ? t.current / t.target : 0}
              caption={t.unlocked ? "Unlocked" : t.remaining(Math.max(0, t.target - t.current))}
              ringId={`ring-${t.key}`}
            />
          </li>
        ))}
      </ul>
      <MilestoneReward
        done={unlockedCount === tiles.length}
        unlocked={unlockedCount}
        total={tiles.length}
        claimedAt={rewardClaimedAt}
      />
    </section>
  );
}

/*
 * The client's completion offer: every milestone unlocked earns one free
 * biryani of the student's choice. The student messages support to claim
 * it; an admin marks it handed over on /admin/users (milestone_rewards),
 * after which this card says so instead of offering the claim link. Until
 * then it's a blush card with a plum → amber "N to go" bar; once earned it
 * becomes the lit plum hero with a "Claim it on WhatsApp" pill.
 */
function MilestoneReward({
  done,
  unlocked,
  total,
  claimedAt,
}: {
  done: boolean;
  unlocked: number;
  total: number;
  claimedAt: string | null;
}) {
  const claimText = encodeURIComponent("Hi MuteBites! I've unlocked all the milestones — I'd like to claim my free biryani.");
  const left = total - unlocked;
  const lit = done && !claimedAt;
  return (
    <div
      className={cn(
        "mt-3 flex items-start gap-3 rounded-[1.5rem] px-4 py-3.5",
        lit ? "surface-hero glow-hero bg-hero text-hero-foreground" : "bg-brand-soft text-brand-soft-foreground",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
          lit ? "bg-hero-foreground/10 text-hero-accent" : "bg-card text-primary",
        )}
      >
        <Gift className="size-4.5" aria-hidden="true" />
      </span>
      <div className="min-w-0 text-sm">
        {claimedAt ? (
          <>
            <p className="font-semibold">Free biryani claimed</p>
            <p className="mt-0.5">
              Handed over on {formatDayMonth(claimedAt)} — enjoy, and thanks for sticking with us.
            </p>
          </>
        ) : done ? (
          <>
            <p className="font-semibold">You&apos;ve earned a free biryani!</p>
            <p className="mt-0.5">Every milestone done — pick any biryani you like, on us.</p>
            <a
              href={`https://wa.me/${SUPPORT_PHONE.replace("+", "")}?text=${claimText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="surface-primary glow-amber mt-3 inline-flex h-10 items-center rounded-full bg-primary px-4 font-semibold text-primary-foreground outline-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-hero-foreground/80"
            >
              Claim it on WhatsApp
            </a>
          </>
        ) : (
          <>
            <p className="font-semibold">A free biryani is waiting</p>
            <p className="mt-0.5">
              Unlock all {MILESTONES.length} milestones and your next biryani is on us — any one you like.{" "}
              <span className="font-semibold tabular-nums">
                {left} to go.
              </span>
            </p>
            <div
              role="progressbar"
              aria-valuenow={unlocked}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label="Milestones toward the free biryani"
              className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-card"
            >
              <div
                className="progress-fill h-full w-(--fill) rounded-full bg-[linear-gradient(90deg,var(--brand-1),var(--brand-2),var(--brand-3))]"
                style={{ "--fill": `${Math.round((unlocked / total) * 100)}%` } as CSSProperties}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Ring geometry for the size-12 (48px) icon circle.
const RING_SIZE = 48;
const RING_STROKE = 3;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function BadgeTile({
  Icon,
  label,
  unlocked,
  progress,
  caption,
  ringId,
}: {
  Icon: LucideIcon;
  label: string;
  unlocked: boolean;
  /** 0–1 fraction toward this milestone, drawn as a ring around a locked icon. */
  progress: number;
  caption: string;
  /** A unique id for the locked ring's gradient (one SVG gradient per tile). */
  ringId: string;
}) {
  const dashOffset = RING_CIRCUMFERENCE * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <div
      className={cn(
        "flex h-full flex-col items-center rounded-2xl px-1.5 pt-3.5 pb-3 text-center",
        unlocked ? "rim-light border bg-card shadow-card" : "border border-dashed bg-transparent",
      )}
    >
      <span className="relative flex size-12 shrink-0 items-center justify-center">
        {!unlocked && (
          <svg viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} className="absolute inset-0 -rotate-90" aria-hidden="true">
            <defs>
              <linearGradient id={ringId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" style={{ stopColor: "var(--brand-1)" }} />
                <stop offset="55%" style={{ stopColor: "var(--brand-2)" }} />
                <stop offset="100%" style={{ stopColor: "var(--brand-3)" }} />
              </linearGradient>
            </defs>
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              strokeWidth={RING_STROKE}
              className="stroke-secondary"
            />
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              stroke={`url(#${ringId})`}
              className="ring-fill"
              style={{ "--ring-empty": RING_CIRCUMFERENCE } as CSSProperties}
            />
          </svg>
        )}
        <span
          className={cn(
            "relative flex items-center justify-center rounded-full",
            unlocked
              ? "surface-hero glow-hero animate-shine size-12 overflow-hidden bg-hero text-hero-accent"
              : "size-9 bg-secondary text-muted-foreground",
          )}
        >
          <Icon className={unlocked ? "size-5.5" : "size-4.5"} aria-hidden="true" />
        </span>
        {!unlocked && (
          <span className="absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-full border bg-card text-muted-foreground">
            <Lock className="size-2.5" aria-hidden="true" />
          </span>
        )}
      </span>
      <span
        className={cn(
          "mt-2 text-xs leading-tight font-semibold",
          unlocked ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      <span className={cn("mt-0.5 text-[0.6875rem] leading-tight", unlocked ? "text-success" : "text-muted-foreground")}>
        {unlocked ? (
          caption
        ) : (
          <>
            <span className="sr-only">Locked · </span>
            {caption}
          </>
        )}
      </span>
    </div>
  );
}
