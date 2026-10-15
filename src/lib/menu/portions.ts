import type { Dish, MenuSection } from "@/lib/data/types";

// Some menus list each size of a dish as its own dish, and the menu groups
// them into ONE card with a size picker, so a section doesn't read as
// near-identical cards side by side. Nothing changes underneath: each size
// is still its own dish (id, price, cart line, order item, place_order()).
//
//   "Apples (500 g)" / "Apples (1 kg)"                 (MuteBites Fresh Fruits)
//   "Sugarcane Juice (Glass)" / "Sugarcane Juice (1 Bottle)"  (Bismillah)
//   "Chicken Tandoori Half" / "Chicken Tandoori Full"   (Bheemasena)
//
// Only these size words count — "Sweet Lemon Juice (Mosambi)" is a name,
// not a size. A new sized dish just needs one of these spellings (or a new
// entry here and in ORDER). Ported from College Bites (Single / Full).

const TAGGED = /^(.*\S)\s+(?:\((500 g|1 kg|Glass|1 Bottle)\)|(Half|Full))$/;
/** Smallest first, so the picker reads small → big. */
const ORDER = ["Half", "Full", "500 g", "1 kg", "Glass", "1 Bottle"];

/** "Apples (500 g)" → { base: "Apples", portion: "500 g" }; any other name → portion null. */
export function splitPortion(name: string): { base: string; portion: string | null } {
  const m = name.match(TAGGED);
  return m ? { base: m[1], portion: m[2] ?? m[3] } : { base: name, portion: null };
}

export type Portion = { label: string; dish: Dish };

export type MenuItem = { kind: "dish"; dish: Dish } | { kind: "portions"; base: string; portions: Portion[] };

/**
 * A section's dishes as menu cards: a dish's sizes become one "portions"
 * item in the first size's place, smallest first. A size with no sibling
 * in the list (Papaya only comes in 1 kg) stays a plain dish.
 */
export function groupPortions(dishes: Dish[]): MenuItem[] {
  const groups = new Map<string, Portion[]>();
  for (const dish of dishes) {
    const { base, portion } = splitPortion(dish.name);
    if (!portion) continue;
    groups.set(base, [...(groups.get(base) ?? []), { label: portion, dish }]);
  }
  const items: MenuItem[] = [];
  const placed = new Set<string>();
  for (const dish of dishes) {
    const { base, portion } = splitPortion(dish.name);
    const group = portion ? groups.get(base) : undefined;
    if (!group || group.length < 2) {
      items.push({ kind: "dish", dish });
      continue;
    }
    if (placed.has(base)) continue;
    placed.add(base);
    items.push({
      kind: "portions",
      base,
      portions: [...group].sort((a, b) => ORDER.indexOf(a.label) - ORDER.indexOf(b.label)),
    });
  }
  return items;
}

/**
 * A menu section as the menu shows it: sizes grouped into one card — but
 * never in a section with extras (Waffle Pops), whose cart lines already
 * differ by extras. The menu's cards, its section counts and the "tried N
 * of M" bar all count from this.
 */
export function menuItems(section: MenuSection): MenuItem[] {
  return section.addons.length > 0 ? section.dishes.map((dish) => ({ kind: "dish", dish })) : groupPortions(section.dishes);
}
