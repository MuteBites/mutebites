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
import { BlurImage } from "@/components/blur-image";
import { advanceOrderStatus, cancelOrder } from "@/lib/admin/actions";
import type { AdminOrder } from "@/lib/data/admin";
import { getDishPhoto } from "@/lib/data/dish-photos";
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
  // Cancel only exists before confirmation — once an admin confirms with
  // the restaurant, the only path forward is marking it delivered.
  const cancellable = status === "pending";

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

  const itemsSummary = order.items.map((i) => `${i.quantity}× ${i.dishName}`).join(", ");
  // First ordered dish that has a photo — same lookup as the student side.
  const photo = order.items
    .map((i) => getDishPhoto(order.restaurantName, i.dishName))
    .find((src): src is string => !!src);
  const whatsAppMessage = `Hi ${order.studentName.split(" ")[0]}, this is MuteBites — confirming your order ${formatOrderNumber(order.dailyNumber)} from ${order.restaurantName} (${formatRupees(order.totalAmount)}). Do you want to go ahead with this order? Reply yes to confirm.`;

  return (
    <div className="rounded-3xl border bg-card p-4 shadow-card">
      <div className="flex items-start gap-3">
        <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-soft font-heading text-xl font-bold text-brand-soft-foreground/60">
          {photo ? (
            <BlurImage src={photo} alt="" sizes="56px" className="object-cover" />
          ) : (
            <span aria-hidden="true">{order.restaurantName.trim().charAt(0)}</span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-heading text-2xl leading-none font-bold tabular-nums">
              {formatOrderNumber(order.dailyNumber)}
            </p>
            <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold", badge.className)}>
              {badge.label}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {order.restaurantName} · {formatOrderTimestamp(order.createdAt)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <p className="truncate font-semibold">{order.studentName}</p>
        {order.studentBanned && (
          <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">
            Banned
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground tabular-nums">{formatStoredMobile(order.contactPhone)}</p>

      {itemsSummary && <p className="mt-2 text-sm">{itemsSummary}</p>}
      {order.notes && <p className="mt-1 text-sm text-muted-foreground italic">“{order.notes}”</p>}

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="font-heading text-xl font-bold tabular-nums">{formatRupees(order.totalAmount)}</span>

        <a
          href={whatsAppLink(order.contactPhone, whatsAppMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-10 items-center gap-1.5 rounded-full bg-success-soft px-4 text-sm font-semibold text-success outline-none hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring/80"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          WhatsApp
        </a>
      </div>

      {(label || cancellable) && (
        <div className="mt-3 flex items-center gap-2">
          {label && (
            <button
              type="button"
              disabled={advancing}
              onClick={advance}
              className={cn(
                "flex h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl text-sm font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/80 disabled:opacity-70",
                isFinalStep
                  ? "bg-success text-success-foreground hover:bg-success/90"
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
                    className="flex h-11 flex-1 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 text-sm font-bold text-destructive outline-none hover:bg-destructive/10 focus-visible:ring-3 focus-visible:ring-ring/80"
                  />
                }
              >
                Cancel
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {order.studentName}&apos;s order {formatOrderNumber(order.dailyNumber)} from{" "}
                    {order.restaurantName} will be marked cancelled. This can&apos;t be undone from here.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={cancelling}>Keep order</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={cancelling}
                    onClick={confirmCancel}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {cancelling && <Loader2 className="size-4 animate-spin" />}
                    Cancel order
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}
    </div>
  );
}
