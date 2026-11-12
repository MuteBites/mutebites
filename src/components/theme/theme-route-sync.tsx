"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { syncThemeToRoute } from "@/lib/theme/store";

/**
 * The admin and the student app each keep their own Light / Dark / System
 * choice. The theme-init script handles a full page load; this re-applies
 * the right one after a client-side navigation between the two.
 */
export function ThemeRouteSync() {
  const pathname = usePathname();
  useEffect(() => {
    syncThemeToRoute();
  }, [pathname]);
  return null;
}
