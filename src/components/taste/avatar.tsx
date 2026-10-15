import { createElement } from "react";
import { getAvatar, type AvatarTone } from "@/lib/taste/options";
import { cn } from "@/lib/utils";

// Each tone is a lit surface from the current palette, so avatars recolour
// with the theme (Plum / Kaapi, light / dark). Every icon-on-fill pair is
// one the contrast audit already checks (hero accent, action, selected
// chip, blush, the Confirmed and Placed status chips).
const TONE: Record<AvatarTone | "pass", string> = {
  hero: "surface-hero bg-hero text-hero-accent",
  primary: "surface-primary bg-primary text-primary-foreground",
  ink: "bg-ink text-ink-foreground",
  blush: "bg-brand-soft text-brand-soft-foreground",
  plum: "bg-plum-soft text-plum-soft-foreground",
  amber: "bg-amber-soft text-amber-soft-foreground",
  // On the campus pass (already a hero card): the plum circle the initials used.
  pass: "bg-hero text-hero-accent",
};

/**
 * A student's avatar: one of the preset food icons (AVATARS) on a round,
 * lit tile — or, until they pick one, their initials in the display face
 * on the lit plum hero (MuteBites' look before avatars). Decorative — the
 * button or heading around it carries the label. Ported from College Bites.
 */
export function Avatar({
  id,
  initials,
  className,
  iconClassName,
  tone,
}: {
  id: string | null | undefined;
  /** Shown when no avatar is picked (or the id is unknown). */
  initials: string;
  className?: string;
  iconClassName?: string;
  /** Override the avatar's own tone ("pass" on the campus pass). */
  tone?: AvatarTone | "pass";
}) {
  const avatar = getAvatar(id);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        TONE[tone ?? avatar?.tone ?? "hero"],
        !avatar && "font-heading font-bold",
        className,
      )}
    >
      {avatar
        ? // createElement: the icon is looked up from a static list, not made during render.
          createElement(avatar.Icon, { className: cn("size-[52%]", iconClassName), strokeWidth: 2.25 })
        : initials}
    </span>
  );
}

/** "Naga Adithya" → "NA" — the fallback avatar. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts.at(-1)![0] : "")).toUpperCase();
}
