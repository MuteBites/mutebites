"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, Trash2 } from "lucide-react";
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
import { adminPill } from "@/components/admin/styles";
import { setRestaurantRemoved } from "@/lib/admin/menu-actions";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

/** "Remove restaurant" at the foot of its menu editor, after an "Are you sure?". */
export function RemoveRestaurantButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await setRestaurantRemoved(id, true);
      if (result.ok) {
        setOpen(false);
        toast.success(`${name} is removed. Add it back any time from Menus.`);
        router.push("/admin/menus");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => (pending ? null : setOpen(next))}>
      <AlertDialogTrigger
        render={
          <button
            type="button"
            className={cn(adminPill, "w-fit border-destructive/30 text-destructive hover:bg-destructive/10")}
          />
        }
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Remove restaurant
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            It disappears from the app for everyone: Home, search, its menu, Sold out and Offers, and students can&apos;t
            order from it. Past orders keep its name. Its menu and photos are kept, so you can add it back any time from
            Menus.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Keep it</AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={remove} variant="danger">
            {pending && <Loader2 className="size-4 animate-spin" />}
            Remove restaurant
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** "Add back" on a removed restaurant's row in Menus — it comes back switched off. */
export function AddBackRestaurantButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await setRestaurantRemoved(id, false);
          if (result.ok) {
            toast.success(`${name} is back. It's switched off: turn it on from More when you're ready.`);
            router.refresh();
          } else {
            toast.error(result.error);
          }
        })
      }
      className={cn(adminPill, "h-9 px-3.5")}
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <RotateCcw className="size-4" aria-hidden="true" />}
      Add back
    </button>
  );
}
