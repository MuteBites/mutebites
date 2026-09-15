import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  priority,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex size-36 items-center justify-center overflow-hidden rounded-[2rem] bg-secondary/70",
        className,
      )}
    >
      <Image
        src="/mutebites-logo.png"
        alt="MuteBites — Good food. Campus mood."
        width={640}
        height={640}
        sizes="144px"
        priority={priority}
        className="size-[88%] rounded-full object-contain"
      />
    </div>
  );
}
