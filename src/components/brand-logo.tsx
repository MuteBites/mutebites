import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The MuteBites mascot mark on its own warm-ivory tile. The tile colour is
 * fixed (not a theme token) on purpose: the plum mascot disappears on a
 * dark card or the plum ink surface, so it always brings its own ground,
 * the same ivory as the startup splash and the app icons. Callers size
 * and round it; the full logo (wordmark + tagline) only appears on the
 * splash, where it's big enough to read.
 */
export function BrandLogo({
  className,
  preload,
}: {
  className?: string;
  preload?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex size-36 items-center justify-center overflow-hidden rounded-[2rem] bg-[#f5eae1]",
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
        className="h-auto w-[84%] object-contain"
      />
    </div>
  );
}
