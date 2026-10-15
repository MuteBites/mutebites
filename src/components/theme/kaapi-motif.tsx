import { cn } from "@/lib/utils";

/**
 * Desi Kaapi's touch on hero cards (promo, campus pass, admin Today card,
 * the picker's preview): a filter-coffee tumbler in its davara with three
 * wisps of steam rising (`motif-steam`, still under reduced motion) and two
 * beans, in the hero's text colour at low strength. It's always in the
 * markup but only shows under Kaapi (`only-kaapi` follows the nearest
 * data-palette), so it's right before hydration and inside preview cards.
 * Size and place it with `className` (it's `absolute`); decorative only.
 * Ported from College Bites' KaapiArt.
 */
export function KaapiMotif({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={cn("only-kaapi pointer-events-none absolute text-hero-foreground/20", className)}
    >
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <g strokeWidth="4">
          <path className="motif-steam" d="M41 34c-6-6 6-10 0-18" />
          <path className="motif-steam [animation-delay:-1s]" d="M53 32c-6-6 6-10 0-18" />
          <path className="motif-steam [animation-delay:-2s]" d="M65 34c-6-6 6-10 0-18" />
        </g>
        <path d="M36 42h34l-4 32H40z" strokeWidth="4.5" />
        <path d="M38 52h30" strokeWidth="3" opacity="0.7" />
        <path d="M20 74h66c-2 10-13 15-33 15s-31-5-33-15z" strokeWidth="4.5" />
        <g fill="currentColor" stroke="none">
          <ellipse cx="13" cy="40" rx="5" ry="7.5" transform="rotate(-30 13 40)" />
          <ellipse cx="89" cy="28" rx="4.5" ry="6.5" transform="rotate(28 89 28)" />
        </g>
      </g>
    </svg>
  );
}
