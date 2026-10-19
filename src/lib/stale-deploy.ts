/**
 * A tab opened before a new deploy can ask for script chunks or server
 * actions that deploy no longer has: buttons silently do nothing and
 * navigations land on the error screen until the student reloads. Next's
 * `deploymentId` (next.config.ts) catches most of it with a hard
 * navigation; this is the safety net for what slips through — spot those
 * errors and reload once (at most every 30 s, so a real outage can't loop).
 */
const STALE = /ChunkLoadError|Loading chunk [\w-]+ failed|Failed to fetch dynamically imported module|Importing a module script failed|Failed to find Server Action|Server Action .* was not found|older or newer deployment/i;
const KEY = "mutebites.stale-reload";

export function isStaleDeployError(error: unknown): boolean {
  const text = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? "");
  return STALE.test(text);
}

/** Reloads the page unless it already did so in the last 30 s. Returns whether it reloaded. */
export function reloadOnce(): boolean {
  try {
    const last = Number(sessionStorage.getItem(KEY) ?? 0);
    if (Date.now() - last < 30_000) return false;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    // No storage (private mode): still reload, the browser's own cache keeps it from looping fast.
  }
  window.location.reload();
  return true;
}
