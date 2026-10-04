"use client";

import { useState, useSyncExternalStore } from "react";
import { Smartphone } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/lib/toast/store";
import { adminPill } from "./styles";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Chrome/Edge/Android fire `beforeinstallprompt` once, early — often before
// React mounts — so it's caught at module load and kept here. iOS Safari
// never fires it; there the button explains Share → Add to Home Screen.
let deferredPrompt: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // keep Chrome's own mini-bar out of the way; the button owns it
    deferredPrompt = e as InstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function subscribeStandalone(listener: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

/**
 * "Install" in the admin header: installs the separate "MuteBites Admin"
 * app (src/lib/web-manifest.ts), which opens straight on /admin. Hidden
 * once you're already inside the installed app.
 */
export function InstallAdminButton() {
  const prompt = useSyncExternalStore(subscribe, () => deferredPrompt, () => null);
  // Server and first client render say "standalone" so nothing flashes
  // before the real check; already inside the installed app → no button.
  const standalone = useSyncExternalStore(subscribeStandalone, isStandalone, () => true);
  const [helpOpen, setHelpOpen] = useState(false);

  if (standalone) return null;

  async function install() {
    if (!prompt) {
      setHelpOpen(true);
      return;
    }
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    deferredPrompt = null; // a prompt can only be used once
    notify();
    if (outcome === "accepted") toast.success("MuteBites Admin is on your home screen.");
  }

  return (
    <>
      <button type="button" onClick={install} aria-label="Install the admin app" className={adminPill}>
        <Smartphone className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Install</span>
      </button>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent>
          <DialogTitle>Install MuteBites Admin</DialogTitle>
          <DialogDescription className="mt-2">
            It opens straight on the admin dashboard, like an app.
          </DialogDescription>
          <ol className="mt-4 flex list-decimal flex-col gap-2 pl-5 text-sm">
            {/iphone|ipad|ipod/i.test(navigator.userAgent) ? (
              <>
                <li>
                  Open this page in <strong className="font-semibold">Safari</strong>.
                </li>
                <li>
                  Tap the <strong className="font-semibold">Share</strong> button.
                </li>
                <li>
                  Choose <strong className="font-semibold">Add to Home Screen</strong>, then Add.
                </li>
              </>
            ) : (
              <>
                <li>
                  Open the browser menu (<strong className="font-semibold">⋮</strong> in Chrome).
                </li>
                <li>
                  Tap <strong className="font-semibold">Install app</strong> or{" "}
                  <strong className="font-semibold">Add to home screen</strong>.
                </li>
                <li>Confirm. The icon says &ldquo;Admin&rdquo; under the mascot.</li>
              </>
            )}
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}
