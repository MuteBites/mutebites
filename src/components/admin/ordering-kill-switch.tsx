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
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="rounded-3xl bg-ink p-5 text-ink-foreground sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
              enabled ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive",
            )}
            aria-hidden="true"
          >
            <Power className="size-4.5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-lg font-bold">Overall Campus Ordering System</h2>
              <Badge
                className={cn(
                  "uppercase",
                  enabled ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive",
                )}
              >
                {enabled ? "System active" : "System paused"}
              </Badge>
            </div>
            <p className="mt-1 max-w-md text-sm text-ink-foreground/70">
              {enabled
                ? "Students can browse dishes, build carts, and place new orders normally across all open restaurants."
                : "New orders are blocked campus-wide. Students can still browse menus, but placing an order fails until you turn ordering back on."}
            </p>
          </div>
        </div>

        <AlertDialog open={open} onOpenChange={(next) => (pending ? null : setOpen(next))}>
          <AlertDialogTrigger
            render={
              <button
                type="button"
                className={cn(
                  "shrink-0 rounded-xl px-4 py-2.5 font-heading text-sm font-bold tracking-wide uppercase outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                  enabled
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : "bg-success text-success-foreground hover:bg-success/90",
                )}
              />
            }
          >
            {enabled ? "Turn off ordering" : "Turn on ordering"}
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
    </div>
  );
}
