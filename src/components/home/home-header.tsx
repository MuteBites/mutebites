import { AboutMuteBitesDialog } from "@/components/home/about-mutebites-dialog";
import { BrandLogo } from "@/components/brand-logo";
import type { TimeOfDay } from "@/lib/date";

const MOOD: Record<TimeOfDay, { greeting: string; emoji: string; heading: string; glow: string }> = {
  morning: {
    greeting: "Good morning",
    emoji: "☀️",
    heading: "Fuel up for the day?",
    glow: "var(--glow-morning)",
  },
  afternoon: {
    greeting: "Hey",
    emoji: "👋",
    heading: "What are we craving now?",
    glow: "var(--glow-afternoon)",
  },
  evening: {
    greeting: "Good evening",
    emoji: "🌆",
    heading: "Dinner o'clock?",
    glow: "var(--glow-evening)",
  },
  night: {
    greeting: "Hey",
    emoji: "🌙",
    heading: "Late night craving?",
    glow: "var(--glow-night)",
  },
};

export function HomeHeader({
  fullName,
  timeOfDay,
}: {
  fullName: string;
  timeOfDay: TimeOfDay;
}) {
  const mood = MOOD[timeOfDay];

  return (
    <header className="relative flex items-center gap-3">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-8 -left-8 size-40 rounded-full blur-2xl"
        style={{
          background: `radial-gradient(circle, color-mix(in srgb, ${mood.glow} 24%, transparent), transparent 70%)`,
        }}
      />
      <AboutMuteBitesDialog>
        <BrandLogo className="relative size-14 rounded-2xl" />
      </AboutMuteBitesDialog>
      <div className="relative min-w-0 flex-1">
        <p className="truncate text-muted-foreground">
          {mood.greeting} {fullName} <span aria-hidden="true">{mood.emoji}</span>
        </p>
        <h1 className="font-heading text-xl font-bold tracking-tight">{mood.heading}</h1>
      </div>
    </header>
  );
}
