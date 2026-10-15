import { cn } from "@/lib/utils";

/**
 * Desi Kaapi's small animated detail for the campus pass's top-right
 * corner — beside the "Campus pass" label, above the name, so it never sits
 * behind text: a filter-coffee tumbler in its davara with steam rising, a
 * soft glow behind it lighting the corner. Shown only under Kaapi
 * (only-kaapi); motion is motif-steam in the reduced-motion-safe block.
 * Decorative. College Bites' PassArt (Kaapi), as is.
 */
export function PassArt({ className }: { className?: string }) {
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
