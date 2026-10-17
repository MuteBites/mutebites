import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The MuteBites mascot mark on its own warm-ivory tile. The tile colour is
 * fixed (not a theme token) on purpose: the plum mascot disappears on a
 * dark card or the plum ink surface, so it always brings its own ground,
 * the same ivory as the startup splash and the app icons. Callers size
 * and round it; the full logo (wordmark + tagline) only appears on the
 * splash, where it's big enough to read. The mark image is the splash's
 * mascot group exactly (scripts/build-brand-assets.mjs), which is what
 * lets the splash land on it seamlessly. On a dark ground the ivory tile
 * gets a lit edge and a soft amber glow (as College Bites does), so it
 * sits on the page instead of looking pasted on.
 */
export function BrandLogo({
  className,
  preload,
  splashTarget,
}: {
  className?: string;
  preload?: boolean;
  /**
   * The startup splash lands on this tile: its ivory screen closes down to
   * the tile and the mascot shrinks onto the mark (components/splash). One
   * per page, on the page's main brand spot (login, Home header).
   */
  splashTarget?: boolean;
}) {
  return (
    <div
      data-splash-target={splashTarget ? "" : undefined}
      className={cn(
        "flex size-36 items-center justify-center overflow-hidden rounded-[2rem] bg-[#f5eae1] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.16),0_10px_28px_-10px_var(--glow-amber)]",
        className,
      )}
    >
      <Image
        src="/brand/mark.webp"
        alt="MuteBites — Good food. Campus mood."
        width={512}
        height={409}
        sizes="144px"
        preload={preload}
        className="h-auto w-[92%] object-contain"
      />
    </div>
  );
}
