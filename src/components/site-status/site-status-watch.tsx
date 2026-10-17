"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const EVERY_MS = 30_000;

/**
 * Pages already open when /dev kills the site or starts maintenance would
 * keep working until the next request. This checks site_status (public
 * read) every 30 s while the tab is visible and on focus, and reloads once
 * it isn't live — the proxy then serves the offline screen. Not on /dev,
 * or /login (?dev is the way back in), which must stay usable.
 */
export function SiteStatusWatch() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/dev" || pathname === "/login") return;
    const supabase = createClient();
    let stopped = false;

    async function check() {
      if (stopped || document.visibilityState !== "visible") return;
      const { data } = await supabase.from("site_status").select("mode").maybeSingle<{ mode: string }>();
      if (!stopped && data && data.mode !== "live") window.location.reload();
    }

    const timer = window.setInterval(check, EVERY_MS);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, [pathname]);

  return null;
}
