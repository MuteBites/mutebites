"use client";

import { setTheme, useThemePreference, type ThemePreference } from "@/lib/theme/store";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

/** Labeled Light / Dark / System segmented control, for a settings section. */
export function ThemeSegmented() {
  const active = useThemePreference();

  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      className="inline-flex items-center gap-1 rounded-full bg-secondary p-1"
    >
      {OPTIONS.map(({ value, label }) => {
        const selected = active === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setTheme(value)}
            className={cn(
              "h-9 rounded-full px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40",
              selected
                ? "bg-ink text-ink-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
