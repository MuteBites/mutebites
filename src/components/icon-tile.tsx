import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A small blush square behind a row's icon — the cart's handover and
 * contact rows (and, later, the profile's details and settings rows).
 */
export function IconTile({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-soft-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
