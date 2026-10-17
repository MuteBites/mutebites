import { Moon, Sun, Sunrise, Sunset, type LucideIcon } from "lucide-react";
import { AboutMuteBitesDialog } from "@/components/home/about-mutebites-dialog";
import { BrandLogo } from "@/components/brand-logo";
import { ChannelPopover } from "@/components/channel/channel-popover";
import { Avatar, initialsOf } from "@/components/taste/avatar";
import { OpenTasteSheetButton } from "@/components/taste/taste-sheet";
import type { TimeOfDay } from "@/lib/date";

// Each time of day gets its own ambient field (.mood-field.mood-<time> in
// globals.css) — sunrise amber, bright afternoon, rose dusk, plum night —
// plus a small time-of-day line and a question to match.
const MOOD: Record<TimeOfDay, { greeting: string; Icon: LucideIcon; question: string }> = {
  morning: { greeting: "Good morning", Icon: Sunrise, question: "Fuel up for the day?" },
  afternoon: { greeting: "Good afternoon", Icon: Sun, question: "What are we craving now?" },
  evening: { greeting: "Good evening", Icon: Sunset, question: "Dinner o'clock?" },
  night: { greeting: "Still up", Icon: Moon, question: "Late night craving?" },
};

/**
 * Home's header, over the time-of-day mood field: the logo (opens About)
 * and the student's avatar — their food icon, or their initials in a lit
 * plum circle until they pick one — which opens the "Your taste" sheet,
 * with the WhatsApp group button (ChannelPopover) beside it;
 * then a small time-of-day line, "Hey, <first name>" as the headline and
 * the question of the hour under it. Trending moved out of
 * here into the "Campus favourites" row (popular-rail.tsx).
 */
export function HomeHeader({
  fullName,
  timeOfDay,
  avatar,
}: {
  fullName: string;
  timeOfDay: TimeOfDay;
  /** The taste profile's avatar id, or null for the student's initials. */
  avatar: string | null;
}) {
  const { greeting, Icon, question } = MOOD[timeOfDay];
  const firstName = fullName.trim().split(/\s+/)[0];

  return (
    // Bleeds out of main's px-6/pt-6 so the field reaches the screen edges
    // and the very top; the field itself runs past the header's bottom and
    // fades out behind whatever comes next.
    <header className="relative -mx-6 -mt-6 px-6 pt-6">
      <div
        aria-hidden="true"
        className={`mood-field mood-${timeOfDay} pointer-events-none absolute inset-x-0 top-0 h-[calc(100%+6rem)]`}
      />
      <div className="relative flex items-center justify-between">
        <AboutMuteBitesDialog>
          <BrandLogo splashTarget className="size-12 rounded-2xl" />
        </AboutMuteBitesDialog>
        <div className="flex items-center gap-2.5">
          <ChannelPopover />
          <OpenTasteSheetButton
            aria-label="Your avatar and taste"
            className="pressable rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
          >
            <Avatar id={avatar} initials={initialsOf(fullName)} className="glow-hero size-11 text-base ring-2 ring-card" />
          </OpenTasteSheetButton>
        </div>
      </div>
      <p className="relative mt-8 flex items-center gap-1.5 text-sm font-semibold">
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        {greeting}
      </p>
      <h1 className="text-heading relative mt-1 font-heading text-display font-bold break-words">Hey, {firstName}</h1>
      <p className="relative mt-1.5 text-lg leading-snug">{question}</p>
    </header>
  );
}
