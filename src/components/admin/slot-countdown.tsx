"use client";

import { AlarmClock, CircleAlert } from "lucide-react";
import { formatTime } from "@/lib/date";
import { useNowSeconds } from "@/lib/use-now";

/** "38:12", or "1 h 12 min" once it's over an hour. */
function formatLeft(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h} h ${m} min`;
  }
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * The Today card's headline (since 12 Nov 2026, delivery times come from
 * the admin, not fixed slots): the next delivery still ahead among the
 * open orders — lunch 1:45–2 PM or a restaurant's set time — counting
 * down, with how many orders are due then; plus how many are already past
 * their time, and how many have no time set yet.
 */
export function SlotCountdown({ openOrders }: { openOrders: { due: string | null }[] }) {
  const now = useNowSeconds();

  if (now === null) {
    return <div className="h-[4.5rem]" aria-hidden="true" />;
  }

  const nowMs = now * 1000;
  const dues = openOrders.map((o) => (o.due ? new Date(o.due).getTime() : null));
  const ahead = dues.filter((d): d is number => d !== null && d > nowMs);
  const next = ahead.length ? Math.min(...ahead) : null;
  const dueNext = next === null ? 0 : dues.filter((d) => d === next).length;
  const overdue = dues.filter((d) => d !== null && d <= nowMs).length;
  const unset = dues.filter((d) => d === null).length;

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        {next !== null ? (
          <div className="min-w-0">
            <p className="font-heading text-3xl leading-none font-bold whitespace-nowrap tabular-nums min-[360px]:text-4xl">
              {formatLeft(Math.floor((next - nowMs) / 1000))}
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm whitespace-nowrap text-hero-foreground/85">
              <AlarmClock className="size-4 shrink-0" aria-hidden="true" />
              to the {formatTime(new Date(next).toISOString())} delivery
            </p>
          </div>
        ) : (
          <div className="min-w-0">
            <p className="font-heading text-3xl leading-none font-bold">
              {openOrders.length ? "Nothing ahead" : "All clear"}
            </p>
            <p className="mt-1.5 text-sm text-hero-foreground/85">
              {openOrders.length ? "Every open order is due now or has no time yet" : "No open orders right now"}
            </p>
          </div>
        )}
        {next !== null && (
          <div className="shrink-0 text-right">
            <p className="font-heading text-3xl leading-none font-bold tabular-nums min-[360px]:text-4xl">{dueNext}</p>
            <p className="mt-1.5 text-sm whitespace-nowrap text-hero-foreground/85">{dueNext === 1 ? "order due" : "orders due"}</p>
          </div>
        )}
      </div>
      {(overdue > 0 || unset > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {overdue > 0 && (
            <p className="inline-flex rounded-full bg-hero-danger/15 px-3 py-1 text-sm font-semibold text-hero-danger">
              {overdue} past {overdue === 1 ? "its" : "their"} time
            </p>
          )}
          {unset > 0 && (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-hero-foreground/12 px-3 py-1 text-sm font-semibold">
              <CircleAlert className="size-4" aria-hidden="true" />
              {unset} with no delivery time
            </p>
          )}
        </div>
      )}
    </div>
  );
}
