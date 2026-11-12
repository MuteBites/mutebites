"use client";

import { useSyncExternalStore } from "react";

function subscribe(onTick: () => void) {
  const id = window.setInterval(onTick, 1000);
  return () => window.clearInterval(id);
}

/**
 * The current time in whole seconds (epoch), ticking once a second; null
 * on the server and before hydration, so a countdown never mismatches.
 */
export function useNowSeconds(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / 1000),
    () => null,
  );
}
