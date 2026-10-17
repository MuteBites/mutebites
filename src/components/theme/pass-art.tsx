import { cn } from "@/lib/utils";

/**
 * The campus pass's small animated detail, per palette (both in the markup,
 * the nearest data-palette shows one).
 *
 * MuteBites Plum: the mascot's cloche, its lid lifting now and then
 * (`pass-lid`) to let a puff of steam out, a sparkle twinkling beside it.
 *
 * Desi Kaapi's small animated detail for the campus pass's top-right
 * corner — beside the "Campus pass" label, above the name, so it never sits
 * behind text: a filter-coffee tumbler in its davara with steam rising, a
 * soft glow behind it lighting the corner. Shown only under Kaapi
 * (only-kaapi); motion is motif-steam in the reduced-motion-safe block.
 * Decorative. College Bites' PassArt (Kaapi), as is.
 */
export function PassArt({ className }: { className?: string }) {
  return (
    <>
      <PlumPassArt className={className} />
      <KaapiPassArt className={className} />
    </>
  );
}

function PlumPassArt({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("only-plum pointer-events-none absolute size-12", className)}>
      <span className="absolute -inset-3 rounded-full bg-[radial-gradient(closest-side,var(--promo-light),transparent)]" />
      <svg viewBox="0 0 48 48" className="relative size-full overflow-visible text-hero-foreground/75">
        <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path className="pass-steam" d="M20 24c-3-3 3-5 0-9" />
          <path className="pass-steam [animation-delay:0.25s]" d="M28 24c-3-3 3-5 0-9" />
        </g>
        <g className="pass-lid">
          <circle cx="24" cy="18.5" r="2.4" fill="currentColor" />
          <path d="M10 34c0-8.5 6.3-14 14-14s14 5.5 14 14z" fill="currentColor" />
          <path d="M15 30c.6-3.4 2.8-6 5.8-7" stroke="white" strokeOpacity="0.45" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        </g>
        <path d="M6 35h36c-1 4-7 6-18 6s-17-2-18-6z" fill="currentColor" opacity="0.9" />
        <path className="motif-twinkle" d="M41 10l1.3 3.2 3.2 1.3-3.2 1.3L41 19l-1.3-3.2-3.2-1.3 3.2-1.3z" fill="currentColor" />
      </svg>
    </span>
  );
}

function KaapiPassArt({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("only-kaapi pointer-events-none absolute size-12", className)}>
      <span className="absolute -inset-3 rounded-full bg-[radial-gradient(closest-side,rgb(255_255_255/0.55),transparent)]" />
      <svg viewBox="0 0 48 48" className="relative size-full text-hero-foreground/75">
        <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path className="motif-steam" d="M19 15c-3-3 3-5 0-9" />
          <path className="motif-steam [animation-delay:-1.1s]" d="M24 14c-3-3 3-5 0-9" />
          <path className="motif-steam [animation-delay:-2.2s]" d="M29 15c-3-3 3-5 0-9" />
        </g>
        <path d="M16 19h16l-2.4 16H18.4z" fill="currentColor" />
        <path d="M17 23.5h14" stroke="white" strokeOpacity="0.45" strokeWidth="1.6" />
        <path d="M9 35h30c-1.2 5.5-7 8-15 8s-13.8-2.5-15-8z" fill="currentColor" opacity="0.9" />
      </svg>
    </span>
  );
}
