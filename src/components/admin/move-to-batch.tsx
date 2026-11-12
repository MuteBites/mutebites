"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { moveOrderToBatch } from "@/lib/admin/delivery-actions";
import { formatTime } from "@/lib/date";
import type { Batch } from "@/lib/delivery";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

/**
 * On an open evening order's page: move it into another of its
 * restaurant's batches today (it just missed a cut-off, or made it after
 * all). The student is told the new time.
 */
export function MoveToBatch({ orderId, current, batches }: { orderId: string; current: string | null; batches: Batch[] }) {
  const router = useRouter();
  const [picked, setPicked] = useState(current ?? "");
  const [pending, startTransition] = useTransition();

  function move() {
    if (!picked || picked === current) return;
    startTransition(async () => {
      const result = await moveOrderToBatch(orderId, picked);
      if (result.ok) {
        toast.success("Order moved. The student was told the new time.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <label className="flex min-w-0 flex-1 items-center gap-2 text-sm">
        <span className="shrink-0 text-muted-foreground">Batch</span>
        <select
          value={picked}
          onChange={(e) => setPicked(e.target.value)}
          className="h-10 min-w-0 flex-1 rounded-full border border-input bg-card px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
        >
          {!current && <option value="">No batch</option>}
          {batches.map((b, i) => (
            <option key={b.id} value={b.id}>
              Batch {i + 1} · until {formatTime(b.orderUntil)} → by {formatTime(b.deliverAt)}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled={pending || !picked || picked === current}
        onClick={move}
        className={cn(
          "flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/80 disabled:opacity-50",
          "surface-primary bg-primary text-primary-foreground",
        )}
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        Move
      </button>
    </div>
  );
}
