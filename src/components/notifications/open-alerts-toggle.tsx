"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Store } from "lucide-react";
import { getOpenAlerts, setOpenAlerts } from "@/lib/notifications/actions";
import { PUSH_CHANGED_EVENT } from "@/lib/notifications/client";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

async function currentEndpoint(): Promise<string | null> {
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    return (await registration?.pushManager.getSubscription())?.endpoint ?? null;
  } catch {
    return null;
  }
}

/**
 * "When ordering opens" — mutes just the rotating "we're open" pushes on
 * this device, keeping order updates. Only usable while this device has
 * notifications on (the switch above); it follows that switch live.
 */
export function OpenAlertsToggle() {
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [on, setOn] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let alive = true;
    async function load() {
      const ep = await currentEndpoint();
      const value = ep ? await getOpenAlerts(ep) : null;
      if (!alive) return;
      setEndpoint(value === null ? null : ep);
      setOn(value === true);
    }
    load();
    window.addEventListener(PUSH_CHANGED_EVENT, load);
    return () => {
      alive = false;
      window.removeEventListener(PUSH_CHANGED_EVENT, load);
    };
  }, []);

  function toggle() {
    if (!endpoint) return;
    const next = !on;
    startTransition(async () => {
      const result = await setOpenAlerts(endpoint, next);
      if (result.ok) {
        setOn(next);
        toast.success(next ? "We'll ping you when ordering opens." : "No more “we're open” pings.");
      } else {
        toast.error(result.error);
      }
    });
  }

  const usable = endpoint !== null;
  return (
    <>
      <div className="min-w-0 flex-1">
        <p id="open-alerts-label" className="font-semibold">
          When ordering opens
        </p>
        <p className="text-sm text-muted-foreground">
          {usable ? "A heads-up each time we open." : "Turn on notifications above first."}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={usable && on}
        aria-labelledby="open-alerts-label"
        disabled={pending || !usable}
        onClick={toggle}
        className={cn(
          "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/80 disabled:opacity-60",
          usable && on ? "surface-primary glow-amber bg-primary" : "bg-secondary",
        )}
      >
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full bg-white text-knob-ink shadow transition-transform",
            usable && on ? "translate-x-7" : "translate-x-1",
          )}
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Store className="size-3.5" aria-hidden="true" />
          )}
        </span>
      </button>
    </>
  );
}
