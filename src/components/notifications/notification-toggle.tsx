"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getOpenAlerts, setOpenAlerts } from "@/lib/notifications/actions";
import {
  disablePush,
  enablePush,
  hasPushSubscription,
  PUSH_CHANGED_EVENT,
  pushState,
} from "@/lib/notifications/client";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

async function currentEndpoint(): Promise<string | null> {
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    return (
      (await registration?.pushManager.getSubscription())?.endpoint ?? null
    );
  } catch {
    return null;
  }
}

/** This device's subscription gets the "ordering is open" pings too (notify_open). */
async function includeOpenAlerts() {
  const endpoint = await currentEndpoint();
  if (endpoint && (await getOpenAlerts(endpoint)) === false)
    await setOpenAlerts(endpoint, true);
}

/**
 * Profile's one Notifications switch (since 18 Oct 2026 — it used to be two,
 * order updates and "when ordering opens"). On = this device is subscribed
 * and gets both kinds; off removes the subscription, which stops both, after
 * an "Are you sure?". Reads the browser's real state on mount rather than
 * trusting a stored flag: permission can be revoked in browser settings, and
 * a subscription belongs to this one browser.
 */
export function NotificationToggle() {
  const [on, setOn] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);
  const [pending, startTransition] = useTransition();

  // Async so the first setState isn't synchronous in the effect body, and
  // so the server-rendered "off" state hydrates before the real answer.
  useEffect(() => {
    let alive = true;
    (async () => {
      const has = await hasPushSubscription();
      if (!alive) return;
      const state = pushState();
      setBlocked(
        state === "denied" ||
          state === "unsupported" ||
          state === "ios-needs-install",
      );
      setOn(has);
      // A device muted on the old separate "when ordering opens" switch:
      // the one switch means both, so bring it back in line.
      if (has) includeOpenAlerts().catch(() => {});
    })();
    return () => {
      alive = false;
    };
  }, []);

  function change(next: boolean) {
    startTransition(async () => {
      const result = next ? await enablePush() : await disablePush();
      if (result.ok) {
        if (next) await includeOpenAlerts().catch(() => {});
        setOn(next);
        setConfirmOff(false);
        window.dispatchEvent(new Event(PUSH_CHANGED_EVENT));
        toast.success(next ? "Notifications on." : "Notifications off.");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Notifications"
        disabled={pending || (blocked && !on)}
        onClick={() => (on ? setConfirmOff(true) : change(true))}
        className={cn(
          "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/80 disabled:opacity-60",
          on ? "surface-slider glow-slider bg-slider" : "bg-secondary",
        )}
      >
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full bg-white text-knob-ink shadow transition-transform",
            on ? "translate-x-7" : "translate-x-1",
          )}
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : on ? (
            <Bell className="size-3.5" aria-hidden="true" />
          ) : (
            <BellOff className="size-3.5" aria-hidden="true" />
          )}
        </span>
      </button>

      <AlertDialog
        open={confirmOff}
        onOpenChange={(next) => !next && !pending && setConfirmOff(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Turn off notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? Your order notifications will stop too — no ping
              when your order is confirmed, delivered or cancelled, and none
              when ordering opens.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              Keep them on
            </AlertDialogCancel>
            <AlertDialogAction
              variant="danger"
              disabled={pending}
              onClick={() => change(false)}
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              Turn off
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
