"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Small form pieces shared by the admin menu dialogs, so every field is the
// same size and colour as the rest of the app's inputs.

export const fieldInput =
  "h-11 w-full min-w-0 rounded-xl border border-input bg-card px-3.5 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/80 aria-invalid:border-destructive";

export function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-label text-muted-foreground">
        {label}
      </label>
      {children}
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** A two-way choice (Veg / Non-veg, On sale / Sold out) as a radio pair. */
export function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-label text-muted-foreground">{label}</p>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-2">
        {options.map((o) => {
          const checked = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => onChange(o.value)}
              className={cn(
                "h-11 rounded-full border text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/80",
                checked ? "border-transparent surface-ink bg-ink text-ink-foreground" : "bg-card shadow-card hover:bg-secondary",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
