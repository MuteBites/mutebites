"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { syncThemeToRoute } from "@/lib/theme/store";

/**
 * The admin is always dark; everywhere else follows the student's own
 * Light / Dark / System choice. The theme-init script handles a full page
 * load; this re-applies it after a client-side navigation between the two.
 */
export function ThemeRouteSync() {
  const pathname = usePathname();
  useEffect(() => {
    syncThemeToRoute();
  }, [pathname]);
  return null;
}
