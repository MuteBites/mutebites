"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { setTheme, useThemePreference, type ThemePreference } from "@/lib/theme/store";

const NEXT: Record<ThemePreference, ThemePreference> = { light: "dark", dark: "system", system: "light" };
const SHOW = {
  light: { label: "Light", Icon: Sun },
  dark: { label: "Dark", Icon: Moon },
  system: { label: "System", Icon: Monitor },
} as const;

/** More's Appearance tile: each tap steps Light → Dark → System (admin only). */
export function ThemeTile({ className }: { className?: string }) {
  const active = useThemePreference();
  const { label, Icon } = SHOW[active];
  return (
    <button
      type="button"
      onClick={() => setTheme(NEXT[active])}
      aria-label={`Appearance: ${label}. Tap to change.`}
      className={className}
    >
      <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-soft-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span>
        Appearance
        <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      </span>
    </button>
  );
}
