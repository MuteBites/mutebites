import type { ReactNode } from "react";
import { KaapiMotif } from "@/components/theme/kaapi-motif";
import { PassArt } from "@/components/theme/pass-art";
import { cn } from "@/lib/utils";

/*
 * The profile's "campus pass": the lit plum hero holding who you are and
 * how you order — the student's initials in a plum circle inside a slowly
 * turning plum / rose / amber ring (`food-ring`, still under reduced
 * motion), name and member-since, the weekly-rank pill, and three stat
 * tiles. Numbers use the display face; the no-show count turns hero-danger
 * once it isn't zero, since that's the stat the ban system actually cares
 * about. Stat labels are full-strength ivory (fainter fails on the hero's
 * lit corner at this size).
 */
export function MemberCard({
  initials,
  name,
  memberSince,
  rankBadge,
  cravingsSolved,
  streakDays,
  noShows,
}: {
  initials: string;
  name: string;
  memberSince: string;
  /** <WeeklyRankBadge/>, which renders nothing when it has nothing flattering to say. */
  rankBadge: ReactNode;
  cravingsSolved: number;
  streakDays: number;
  noShows: number;
}) {
  return (
    <section className="surface-hero glow-hero relative overflow-hidden rounded-[1.75rem] bg-hero p-5 text-hero-foreground">
      {/* Desi Kaapi (as on College Bites): the tumbler motif in the corner,
          and a small steaming tumbler detail by the label. Hidden for Plum. */}
      <KaapiMotif className="-top-16 -right-16 size-36" />
      <PassArt className="top-3.5 right-4" />
      <p className="relative text-label text-hero-accent">Campus pass</p>
      <div className="relative mt-3 flex items-center gap-4">
        <span className="relative block size-[4.5rem] shrink-0 rounded-full p-[3px]">
          <span aria-hidden="true" className="food-ring animate-ring-spin absolute inset-0 rounded-full" />
          <span className="relative flex size-full items-center justify-center rounded-full bg-hero font-heading text-2xl font-bold text-hero-accent ring-2 ring-hero">
            {initials}
          </span>
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-heading text-title font-bold">{name}</h1>
          <p className="text-sm text-hero-foreground/85">Member since {memberSince}</p>
        </div>
      </div>

      <div className="relative mt-4 empty:hidden">{rankBadge}</div>

      <dl className="relative mt-5 grid grid-cols-3 gap-2 text-center">
        <Stat value={cravingsSolved} label={cravingsSolved === 1 ? "craving solved" : "cravings solved"} />
        <Stat value={streakDays} label="day streak" />
        <Stat value={noShows} label={noShows === 1 ? "no-show" : "no-shows"} danger={noShows > 0} />
      </dl>
    </section>
  );
}

function Stat({ value, label, danger = false }: { value: number; label: string; danger?: boolean }) {
  return (
    <div className="rim-light flex flex-col-reverse justify-end rounded-2xl bg-hero-foreground/10 px-1 py-2.5">
      <dt className="text-xs leading-tight text-hero-foreground">{label}</dt>
      <dd className={cn("font-heading text-2xl font-bold tabular-nums", danger && "text-hero-danger")}>{value}</dd>
    </div>
  );
}
