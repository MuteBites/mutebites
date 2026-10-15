"use client";

import { Check } from "lucide-react";
import { KaapiMotif } from "@/components/theme/kaapi-motif";
import { PALETTES } from "@/lib/theme/palettes";
import { setPalette, usePalette } from "@/lib/theme/store";
import { cn } from "@/lib/utils";

/**
 * The palettes as preview cards (Profile → Settings → Theme, and the
 * first-login form). Each card's inner tile carries its own data-palette,
 * so it's drawn with that palette's real tokens — ground, lit hero (and
 * Kaapi's tumbler), action pill, selected chip, card — in the current
 * light/dark mode, not a copy of its hex values. The selection ring and
 * tick sit outside it, in the page's palette. Choosing one switches the
 * whole app at once (a cross-fade), per device.
 */
export function PalettePicker({ className }: { className?: string }) {
  const active = usePalette();

  return (
    <div role="radiogroup" aria-label="Theme" className={cn("grid grid-cols-2 gap-3", className)}>
      {PALETTES.map(({ id, name, blurb }) => {
        const selected = active === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setPalette(id)}
            className={cn(
              "relative rounded-[1.4rem] p-1 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/80",
              selected ? "surface-primary glow-amber bg-primary" : "bg-transparent",
            )}
          >
            <span
              data-palette={id}
              className="flex h-full flex-col rounded-[1.1rem] border bg-background p-2.5 text-foreground shadow-card"
            >
              <span aria-hidden="true" className="surface-hero relative block h-11 overflow-hidden rounded-xl bg-hero">
                <KaapiMotif className="-right-1 -bottom-3 size-14" />
              </span>
              <span aria-hidden="true" className="mt-2 flex items-center gap-1.5">
                <span className="surface-primary h-5 flex-1 rounded-full bg-primary" />
                <span className="size-5 shrink-0 rounded-full bg-ink" />
                <span className="size-5 shrink-0 rounded-full border bg-card" />
              </span>
              <span className="mt-2.5 block text-sm leading-tight font-semibold">{name}</span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{blurb}</span>
            </span>
            {selected && (
              <span className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card ring-2 ring-background">
                <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
