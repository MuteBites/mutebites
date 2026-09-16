"use client";

import { useState, useTransition } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { advanceOrderStatus, cancelOrder } from "@/lib/admin/actions";
import type { AdminOrder } from "@/lib/data/admin";
import { formatOrderTimestamp } from "@/lib/date";
import { formatRupees } from "@/lib/format";
import { advanceLabel, formatOrderNumber, nextStatus, statusBadge } from "@/lib/orders/status";
import { formatStoredMobile, whatsAppLink } from "@/lib/phone";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

export function OrderCard({ order }: { order: AdminOrder }) {
  const [status, setStatus] = useState(order.status);
  // Tracks the prop so a fresh server re-fetch (e.g. "Mark all delivered"
  // changing this order from elsewhere, not through this card's own
  // advance button) can resync local state — set during render, not an
  // effect, so there's no extra render/flash. See "Adjusting state based
  // on a prop change" in the React docs.
  const [prevPropStatus, setPrevPropStatus] = useState(order.status);
  if (order.status !== prevPropStatus) {
    setPrevPropStatus(order.status);
    setStatus(order.status);
  }
  const [advancing, startAdvance] = useTransition();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, startCancel] = useTransition();

  const badge = statusBadge(status);
  const label = advanceLabel(status);
  const isFinalStep = status === "confirmed"; // → delivered
  const cancellable = status !== "delivered" && status !== "cancelled";

  function advance() {
    startAdvance(async () => {
      const result = await advanceOrderStatus(order.id, status);
      if (result.ok) {
        setStatus((s) => nextStatus(s) ?? s);
        toast.success(isFinalStep ? "Order marked delivered." : "Order confirmed with restaurant.");
      } else {
        toast.error(result.error);
      }
    });
  }

  function confirmCancel() {
    startCancel(async () => {
      const result = await cancelOrder(order.id, status);
      if (result.ok) {
        setStatus("cancelled");
        setCancelOpen(false);
        toast.success("Order cancelled.");
      } else {
        toast.error(result.error);
      }
    });
  }

  const itemsSummary = order.items.map((i) => `${i.dishName} x${i.quantity}`).join(", ");
  const whatsAppMessage = `Hi ${order.studentName.split(" ")[0]}, this is MuteBites — confirming your order ${formatOrderNumber(order.dailyNumber)} from ${order.restaurantName} (${formatRupees(order.totalAmount)}). Do you want to go ahead with this order? Reply yes to confirm.`;

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-mono text-sm font-semibold text-muted-foreground">
            {formatOrderNumber(order.dailyNumber)}
          </span>
          <span className="ml-2 text-sm text-muted-foreground">{formatOrderTimestamp(order.createdAt)}</span>
        </div>
        <Badge className={cn("uppercase", badge.className)}>{badge.label}</Badge>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <p className="truncate font-heading text-base font-bold">{order.studentName}</p>
        {order.studentBanned && (
          <Badge className="bg-destructive/10 text-destructive uppercase">Banned</Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        {formatStoredMobile(order.contactPhone)} · {order.restaurantName}
      </p>

      {itemsSummary && <p className="mt-2 text-sm font-medium text-brand-soft-foreground">{itemsSummary}</p>}
      {order.notes && <p className="mt-1 text-sm text-muted-foreground italic">“{order.notes}”</p>}

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="font-heading text-xl font-bold tabular-nums">{formatRupees(order.totalAmount)}</span>

        <a
          href={whatsAppLink(order.contactPhone, whatsAppMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-semibold text-success outline-none hover:bg-success-soft focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <MessageCircle className="size-3.5" />
          WhatsApp
        </a>
      </div>

      {label && (
        <button
          type="button"
          disabled={advancing}
          onClick={advance}
          className={cn(
            "mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl font-heading text-sm font-bold uppercase outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-70",
            isFinalStep
              ? "bg-success text-white hover:bg-success/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
        >
          {advancing && <Loader2 className="size-4 animate-spin" />}
          {label}
        </button>
      )}

      {cancellable && (
        <AlertDialog open={cancelOpen} onOpenChange={(next) => (cancelling ? null : setCancelOpen(next))}>
          <AlertDialogTrigger
            render={
              <button
                type="button"
                className="mt-2 w-full text-center text-xs font-medium text-muted-foreground outline-none hover:text-destructive hover:underline"
              />
            }
          >
            Cancel order
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
              <AlertDialogDescription>
                {order.studentName}&apos;s order {formatOrderNumber(order.dailyNumber)} from {order.restaurantName}{" "}
                will be marked cancelled. This can&apos;t be undone from here.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={cancelling}>Keep order</AlertDialogCancel>
              <AlertDialogAction
                disabled={cancelling}
                onClick={confirmCancel}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {cancelling && <Loader2 className="size-4 animate-spin" />}
                Cancel order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
