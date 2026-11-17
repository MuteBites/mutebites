"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban } from "lucide-react";
import { toast } from "@/lib/toast/store";
import { setTokenBlocked } from "@/lib/admin/token-actions";
import { cn } from "@/lib/utils";

/** The grid of today's numbers still ahead; a tap blocks / unblocks one. */
export function TokenBlocker({
  numbers,
  blocked,
  lastTaken,
}: {
  numbers: number[];
  blocked: number[];
  lastTaken: number;
}) {
  const router = useRouter();
  const [on, setOn] = useState(() => new Set(blocked));
  const [busy, setBusy] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  function toggle(n: number) {
    const next = !on.has(n);
    setBusy(n);
    setOn((s) => {
      const c = new Set(s);
      if (next) c.add(n);
      else c.delete(n);
      return c;
    });
    startTransition(async () => {
      const res = await setTokenBlocked(n, next);
      setBusy(null);
      if (!res.ok) {
        setOn((s) => {
          const c = new Set(s);
          if (next) c.delete(n);
          else c.add(n);
          return c;
        });
        toast.error(res.error);
        router.refresh();
        return;
      }
      toast.success(next ? `Order #${n} blocked for today` : `Order #${n} unblocked`);
    });
  }

  const blockedList = numbers.filter((n) => on.has(n));

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border bg-card p-4 shadow-card">
        <p className="text-sm text-muted-foreground">
          {lastTaken > 0 ? `Last order today: #${lastTaken}` : "No orders yet today"}
        </p>
        <p className="mt-1 font-semibold">
          {blockedList.length > 0
            ? `Blocked: ${blockedList.map((n) => `#${n}`).join(", ")}`
            : "No numbers blocked"}
        </p>
      </div>

      <ul className="grid grid-cols-5 gap-2" aria-label="Order numbers">
        {numbers.map((n) => {
          const isOn = on.has(n);
          return (
            <li key={n}>
              <button
                type="button"
                aria-pressed={isOn}
                disabled={busy === n}
                onClick={() => toggle(n)}
                className={cn(
                  "relative flex h-12 w-full items-center justify-center rounded-2xl border text-base font-bold tabular-nums shadow-card outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/80 disabled:opacity-60",
                  isOn ? "border-destructive bg-destructive/10 text-destructive" : "bg-card hover:bg-secondary/60",
                )}
              >
                {isOn && <Ban className="absolute top-1 right-1 size-3" aria-hidden="true" />}
                <span className={cn(isOn && "line-through")}>{n}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
