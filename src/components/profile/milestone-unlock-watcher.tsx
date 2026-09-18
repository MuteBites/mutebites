"use client";

import { useEffect } from "react";
import { toast } from "@/lib/toast/store";
import { MILESTONES, type MilestoneKey } from "./milestone-badges";

const SEEN_KEY = "mutebites.milestones-seen";

const LABELS = Object.fromEntries(MILESTONES.map((m) => [m.key, m.label])) as Record<MilestoneKey, string>;

/**
 * Fires a toast the first time a milestone badge is newly unlocked,
 * remembered per device in localStorage (not tied to the account, same
 * as the confetti-shown flag). On a student's very first visit after this
 * shipped, any milestone already unlocked gets one celebratory toast even
 * though it isn't "new" — a one-time false positive that isn't worth
 * guarding against.
 */
export function MilestoneUnlockWatcher({ unlockedCsv }: { unlockedCsv: string }) {
  useEffect(() => {
    const unlocked = unlockedCsv ? (unlockedCsv.split(",") as MilestoneKey[]) : [];

    let seen: string[] = [];
    try {
      seen = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]");
    } catch {
      seen = [];
    }
    const seenSet = new Set(seen);
    const newlyUnlocked = unlocked.filter((key) => !seenSet.has(key));

    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(unlocked));
    } catch {
      // Storage unavailable — the toast below still fires this visit, just may repeat next time.
    }

    for (const key of newlyUnlocked) {
      toast.success(`Milestone unlocked: ${LABELS[key]}!`, { icon: "trophy" });
    }
  }, [unlockedCsv]);

  return null;
}
