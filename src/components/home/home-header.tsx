"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TimeOfDay } from "@/lib/date";
import { formatStoredMobile } from "@/lib/phone";
import { signOutAndClearCart } from "@/lib/sign-out";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts.at(-1)![0] : "")).toUpperCase();
}

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
  email,
  phone,
  timeOfDay,
}: {
  fullName: string;
  email: string;
  phone: string;
  timeOfDay: TimeOfDay;
}) {
  const [signingOut, startSignOut] = useTransition();
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
      <BrandLogo className="relative size-14 rounded-2xl" />
      <div className="relative min-w-0 flex-1">
        <p className="truncate text-muted-foreground">
          {mood.greeting} {fullName} <span aria-hidden="true">{mood.emoji}</span>
        </p>
        <h1 className="font-heading text-xl font-bold tracking-tight">{mood.heading}</h1>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Account menu"
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-lg font-bold text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          {initials(fullName)}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 rounded-xl p-1.5">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-2 py-2">
              <span className="block text-sm font-semibold text-foreground">{fullName}</span>
              <span className="block truncate">{email}</span>
              <span className="block">{formatStoredMobile(phone)}</span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={signingOut}
            onClick={() => startSignOut(() => signOutAndClearCart())}
            className="px-2 py-2"
          >
            <LogOut />
            {signingOut ? "Signing out…" : "Sign out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
