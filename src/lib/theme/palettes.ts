// The colour palettes a student can pick (Profile → Settings → Theme, and
// the first-login form). Each is a complete light + dark token set in
// src/app/globals.css, keyed on `data-palette` on <html>. This file is
// client-safe and import-free: the theme-init script inlines the ground
// colours below, so keep them in step with globals.css.

export type PaletteId = "plum" | "kaapi";

// Everyone starts on MuteBites Plum; Desi Kaapi is for those who pick it.
export const DEFAULT_PALETTE: PaletteId = "plum";

export const PALETTES: { id: PaletteId; name: string; blurb: string }[] = [
  { id: "plum", name: "MuteBites Plum", blurb: "Plum, amber and rose — the original" },
  { id: "kaapi", name: "Desi Kaapi", blurb: "Filter coffee, turmeric and rose milk" },
];

export const PALETTE_IDS = PALETTES.map((p) => p.id);

/** Each palette's page ground (--background), light and dark — the browser bar colour. */
export const PALETTE_GROUNDS: Record<PaletteId, { light: string; dark: string }> = {
  plum: { light: "#faf3ec", dark: "#170f14" },
  kaapi: { light: "#f6eee3", dark: "#1c120d" },
};

export function isPaletteId(v: unknown): v is PaletteId {
  return typeof v === "string" && (PALETTE_IDS as string[]).includes(v);
}
