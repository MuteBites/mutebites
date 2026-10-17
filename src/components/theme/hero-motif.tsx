import { KaapiMotif } from "@/components/theme/kaapi-motif";
import { PlumMotif } from "@/components/theme/plum-motif";

/**
 * The palette's illustration on a hero card: Plum's cloche or Kaapi's
 * tumbler. Both are in the markup and the nearest data-palette shows one,
 * so it's right before hydration and inside the picker's preview cards.
 * Same `className` for both (it's `absolute`).
 */
export function HeroMotif({ className }: { className?: string }) {
  return (
    <>
      <PlumMotif className={className} />
      <KaapiMotif className={className} />
    </>
  );
}
