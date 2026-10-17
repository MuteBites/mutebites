import { cn } from "@/lib/utils";

/**
 * MuteBites Plum's touch on hero cards — the counterpart of Desi Kaapi's
 * tumbler (KaapiMotif), drawn the same way: the mascot's serving cloche on
 * its tray, three wisps of steam rising off the knob (`motif-steam`) and
 * two sparkles that twinkle (`motif-twinkle`), in the hero's text colour
 * at low strength. Always in the markup, shown only under Plum
 * (`only-plum` follows the nearest data-palette). Size and place it with
 * `className` (it's `absolute`); decorative only. Use HeroMotif, which
 * renders whichever palette is on.
 */
export function PlumMotif({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={cn("only-plum pointer-events-none absolute text-hero-foreground/20", className)}
    >
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <g strokeWidth="4">
          <path className="motif-steam" d="M40 26c-6-6 6-10 0-18" />
          <path className="motif-steam [animation-delay:-1s]" d="M52 24c-6-6 6-10 0-18" />
          <path className="motif-steam [animation-delay:-2s]" d="M64 26c-6-6 6-10 0-18" />
        </g>
        <circle cx="50" cy="35" r="4" strokeWidth="4" />
        <path d="M22 70c0-19 12.5-31 28-31s28 12 28 31" strokeWidth="4.5" />
        <path d="M31 62c1-8 6-14 13-16" strokeWidth="3" opacity="0.7" />
        <path d="M14 71h72" strokeWidth="4.5" />
        <path d="M20 79h60c-3 6-14 9-30 9s-27-3-30-9z" strokeWidth="4.5" />
      </g>
      <g fill="currentColor">
        <path className="motif-twinkle" d="M13 36l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
        <path className="motif-twinkle [animation-delay:-1.4s]" d="M88 20l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" />
      </g>
    </svg>
  );
}
