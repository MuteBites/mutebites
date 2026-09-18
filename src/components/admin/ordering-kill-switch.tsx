"use client";

import { useState, useTransition } from "react";
import { Loader2, Power } from "lucide-react";
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
import { setOrderingEnabled } from "@/lib/admin/actions";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

export function OrderingKillSwitch({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    const next = !enabled;
    startTransition(async () => {
      const result = await setOrderingEnabled(next);
      if (result.ok) {
        setEnabled(next);
        setOpen(false);
        toast.success(next ? "Ordering turned back on campus-wide." : "Ordering paused campus-wide.");
      } else {
        toast.error(result.error);
      }
    });
  }

  // Rendered as the footer row of the dashboard's plum "Today" card
  // (StatCards), so it uses the ink-surface tokens throughout.
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
            enabled ? "bg-ink-success/20 text-ink-success" : "bg-ink-danger/20 text-ink-danger",
          )}
          aria-hidden="true"
        >
          <Power className="size-4.5" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold">
            {enabled ? "Campus ordering is live" : "Campus ordering is paused"}
          </p>
          <p className="max-w-md text-sm text-ink-foreground/75">
            {enabled
              ? "Students can place orders at every open restaurant."
              : "New orders are blocked everywhere. Menus stay browsable."}
          </p>
        </div>
      </div>

        <AlertDialog open={open} onOpenChange={(next) => (pending ? null : setOpen(next))}>
          <AlertDialogTrigger
            render={
              <button
                type="button"
                className={cn(
                  "flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-bold outline-none focus-visible:ring-3 focus-visible:ring-ink-foreground/40",
                  enabled
                    ? "bg-ink-foreground/10 text-ink-danger hover:bg-ink-foreground/15"
                    : "bg-ink-success text-ink hover:brightness-95",
                )}
              />
            }
          >
            {enabled ? "Pause ordering" : "Turn ordering on"}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {enabled ? "Turn off ordering campus-wide?" : "Turn ordering back on?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {enabled
                  ? "No student will be able to place a new order at any restaurant until you turn it back on. Existing orders already placed aren't affected."
                  : "Students will immediately be able to place new orders again at every open restaurant."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={pending}
                onClick={confirm}
                className={cn(enabled ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "")}
              >
                {pending && <Loader2 className="size-4 animate-spin" />}
                {enabled ? "Turn off ordering" : "Turn on ordering"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
