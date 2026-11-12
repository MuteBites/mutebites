"use client";

import { AlarmClock, Moon } from "lucide-react";
import { formatTime, slotEndTime } from "@/lib/date";
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
 * The Today card's headline: the delivery slot an order placed right now
 * would get (slotEndTime — 1:30 / 7:30 / 8:15 PM), counting down to its
 * end, with how many open orders are due in it, and how many are already
 * past their slot. After 7 PM there's no slot ("to be confirmed").
 */
export function SlotCountdown({ openOrders }: { openOrders: { createdAt: string }[] }) {
  const now = useNowSeconds();

  if (now === null) {
    return <div className="h-[4.5rem]" aria-hidden="true" />;
  }

  const nowMs = now * 1000;
  const end = slotEndTime(new Date(nowMs).toISOString()).getTime();
  const hasSlot = end > nowMs;
  const inSlot = hasSlot ? openOrders.filter((o) => slotEndTime(o.createdAt).getTime() === end).length : 0;
  const overdue = openOrders.filter((o) => slotEndTime(o.createdAt).getTime() <= nowMs).length;

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        {hasSlot ? (
          <div className="min-w-0">
            <p className="font-heading text-3xl leading-none font-bold whitespace-nowrap tabular-nums min-[360px]:text-4xl">
              {formatLeft(Math.floor((end - nowMs) / 1000))}
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm whitespace-nowrap text-hero-foreground/85">
              <AlarmClock className="size-4 shrink-0" aria-hidden="true" />
              left · {formatTime(new Date(end).toISOString())} slot
            </p>
          </div>
        ) : (
          <div className="min-w-0">
            <p className="font-heading text-3xl leading-none font-bold">Late orders</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-hero-foreground/85">
              <Moon className="size-4 shrink-0" aria-hidden="true" />
              After 7 PM: delivery time to be confirmed
            </p>
          </div>
        )}
        {hasSlot && (
          <div className="shrink-0 text-right">
            <p className="font-heading text-3xl leading-none font-bold tabular-nums min-[360px]:text-4xl">{inSlot}</p>
            <p className="mt-1.5 text-sm whitespace-nowrap text-hero-foreground/85">{inSlot === 1 ? "order in it" : "orders in it"}</p>
          </div>
        )}
      </div>
      {overdue > 0 && (
        <p className="mt-3 inline-flex rounded-full bg-hero-danger/15 px-3 py-1 text-sm font-semibold text-hero-danger">
          {overdue} {overdue === 1 ? "order is" : "orders are"} past their slot
        </p>
      )}
    </div>
  );
}
