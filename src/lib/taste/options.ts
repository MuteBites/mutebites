import {
  Coffee,
  CookingPot,
  CupSoda,
  Donut,
  Drumstick,
  EggFried,
  Flame,
  Grape,
  Hamburger,
  IceCreamCone,
  Soup,
  type LucideIcon,
} from "lucide-react";
import type { SearchableDish } from "@/lib/data/restaurants";
import { FOOD_TYPES, isFoodType } from "@/lib/home-filters";

// The taste profile's choices (public.taste_profiles). Client-safe — the
// sheet, the avatar and the server action all read these lists. The
// database checks the same rules (spice 1–5, the three diets, cravings
// from FOOD_TYPES, avatar a short id), so change them together. Ported
// from College Bites; MuteBites keeps the student's initials until they
// pick an avatar (avatar null).

/** How an avatar tile is lit — each one picks an audited surface from the current palette. */
export type AvatarTone = "hero" | "primary" | "ink" | "blush" | "plum" | "amber";

// Eleven, so with "Your initials" first the picker is an even 4 × 3 grid.
export const AVATARS: { id: string; label: string; Icon: LucideIcon; tone: AvatarTone }[] = [
  { id: "pot", label: "Biryani pot", Icon: CookingPot, tone: "hero" },
  { id: "noodles", label: "Noodle bowl", Icon: Soup, tone: "plum" },
  { id: "chilli", label: "Chilli heat", Icon: Flame, tone: "primary" },
  { id: "drumstick", label: "Drumstick", Icon: Drumstick, tone: "amber" },
  { id: "egg", label: "Fried egg", Icon: EggFried, tone: "blush" },
  { id: "burger", label: "Burger", Icon: Hamburger, tone: "ink" },
  { id: "chai", label: "Chai", Icon: Coffee, tone: "hero" },
  { id: "juice", label: "Juice", Icon: CupSoda, tone: "plum" },
  { id: "grapes", label: "Grapes", Icon: Grape, tone: "primary" },
  { id: "icecream", label: "Ice cream", Icon: IceCreamCone, tone: "blush" },
  { id: "donut", label: "Donut", Icon: Donut, tone: "amber" },
];

export function getAvatar(id: string | null | undefined) {
  return AVATARS.find((a) => a.id === id) ?? null;
}

export type Diet = "veg" | "egg" | "nonveg";

export const DIETS: { id: Diet; label: string }[] = [
  { id: "veg", label: "Veg" },
  { id: "egg", label: "Egg is fine" },
  { id: "nonveg", label: "Non-veg" },
];

export const SPICE_LEVELS: { level: number; label: string }[] = [
  { level: 1, label: "Mild" },
  { level: 2, label: "Gentle" },
  { level: 3, label: "Medium" },
  { level: 4, label: "Spicy" },
  { level: 5, label: "Extra spicy" },
];

/** The food types a student can say they crave — Home's tiles. */
export const CRAVINGS = FOOD_TYPES.map((t) => ({ key: t.key, label: t.label, photo: t.photo }));

export type TasteProfile = {
  /** A preset avatar id, or null = show the student's initials. */
  avatar: string | null;
  spiceLevel: number | null;
  diet: Diet | null;
  cravings: string[];
};

export const EMPTY_TASTE: TasteProfile = { avatar: null, spiceLevel: null, diet: null, cravings: [] };

/** How many of the three questions (spice, diet, cravings) are answered. */
export function answeredCount(t: TasteProfile): number {
  return (t.spiceLevel ? 1 : 0) + (t.diet ? 1 : 0) + (t.cravings.length > 0 ? 1 : 0);
}

/**
 * A one-tap note for the cart, from the spice answer: mild eaters get
 * "Less spicy please", spice lovers "Extra spicy please", the middle
 * nothing. Only ever offered, never typed in for them.
 */
export function spiceNote(level: number | null): string | null {
  if (level === 1 || level === 2) return "Less spicy please";
  if (level === 5) return "Extra spicy please";
  return null;
}

/** "Medium · Veg · Biryani, Noodles" — the Profile row's summary. */
export function tasteSummary(t: TasteProfile): string {
  const parts: string[] = [];
  if (t.spiceLevel) parts.push(SPICE_LEVELS[t.spiceLevel - 1].label);
  if (t.diet) parts.push(DIETS.find((d) => d.id === t.diet)!.label);
  if (t.cravings.length) {
    parts.push(
      t.cravings
        .map((k) => CRAVINGS.find((c) => c.key === k)?.label)
        .filter(Boolean)
        .join(", "),
    );
  }
  return parts.join(" · ");
}

/**
 * The food types a student's hearted dishes belong to, most-hearted
 * first — e.g. three hearted noodle dishes put "noodles" ahead. Builds on
 * the stated cravings: Home's tiles go cravings first, then these, and the
 * taste sheet marks these "From your hearts" while cravings are empty.
 */
export function heartCravings(liked: SearchableDish[]): string[] {
  return FOOD_TYPES.map((t) => ({ key: t.key, n: liked.filter((d) => isFoodType(d, t)).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .map((x) => x.key);
}

/** Home's tile order: what they said they crave, then what their hearts say. */
export function cravingOrder(t: TasteProfile, fromHearts: string[]): string[] {
  return [...t.cravings, ...fromHearts.filter((k) => !t.cravings.includes(k))];
}
