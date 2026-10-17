import type { OpenPushResult } from "@/lib/notifications/ordering-open";

/**
 * The admin toast's second sentence about the "we're open" push. `quiet`
 * (turning a restaurant on) only mentions a push that actually went out —
 * an admin turns several restaurants on in a row.
 */
export function openPushNote(push: OpenPushResult | undefined, quiet = false): string {
  if (!push) return "";
  if (push.sent) {
    if (push.students === 0) return " No students have notifications on yet.";
    return ` Notified ${push.students} ${push.students === 1 ? "student" : "students"}.`;
  }
  if (quiet) return "";
  if (push.reason === "cooldown") return " Students were already notified in the last 3 hours.";
  if (push.reason === "no-restaurant") return " Students get a ping once you turn a restaurant on.";
  return "";
}
