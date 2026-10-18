"use client";

import { useEffect, useState, type ReactNode } from "react";

const KEY = "mutebites.promo";

/**
 * PROTOTYPE switch between Plum's current promo scene and the "On the way
 * to you" ride (PlumRide). `?promo=new` turns the ride on for this device
 * (remembered in localStorage), `?promo=old` turns it back off. Everyone
 * else keeps the current scene. The server always renders the current
 * one; the swap happens after hydration.
 */
export function PlumPromoChooser({ classic, ride }: { classic: ReactNode; ride: ReactNode }) {
  const [useRide, setUseRide] = useState(false);

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("promo");
    try {
      if (param === "new") localStorage.setItem(KEY, "new");
      if (param === "old") localStorage.removeItem(KEY);
      // Reading storage after mount — the ride can't render on the server.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUseRide(param === "new" || (param !== "old" && localStorage.getItem(KEY) === "new"));
    } catch {
      setUseRide(param === "new");
    }
  }, []);

  return <>{useRide ? ride : classic}</>;
}
