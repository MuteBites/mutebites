"use client";

import { useEffect } from "react";
import { isStaleDeployError, reloadOnce } from "@/lib/stale-deploy";

/** Reloads once when a stale-deploy error escapes (a failed chunk or server action). */
export function StaleDeployGuard() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => isStaleDeployError(event.error ?? event.message) && reloadOnce();
    const onRejection = (event: PromiseRejectionEvent) => isStaleDeployError(event.reason) && reloadOnce();
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
