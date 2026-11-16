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
        toast.success(`${name} is removed. Add it back any time from Restaurants & menus.`);
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
            toast.success(`${name} is back. It's switched off: turn it on from Kitchen when you're ready.`);
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

/**
 * "Remove restaurant" beside "Add restaurant" on Menus: the admin picks
 * which one, confirms, and it moves to Removed restaurants (Add back there).
 */
export function RemoveRestaurantPicker({ restaurants }: { restaurants: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const chosen = restaurants.find((r) => r.id === picked);

  function remove() {
    if (!chosen) return;
    startTransition(async () => {
      const result = await setRestaurantRemoved(chosen.id, true);
      if (result.ok) {
        setOpen(false);
        setPicked(null);
        toast.success(`${chosen.name} is removed. Add it back any time under Removed restaurants.`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next) setPicked(null);
      }}
    >
      <AlertDialogTrigger
        disabled={restaurants.length === 0}
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
          <AlertDialogTitle>{chosen ? `Remove ${chosen.name}?` : "Which restaurant?"}</AlertDialogTitle>
          <AlertDialogDescription>
            It disappears from the app for everyone and students can&apos;t order from it. Past orders keep its name,
            and its menu and photos are kept, so you can add it back any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div role="radiogroup" aria-label="Restaurant to remove" className="max-h-72 space-y-1.5 overflow-y-auto">
          {restaurants.map((r) => (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={picked === r.id}
              onClick={() => setPicked(r.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/80",
                picked === r.id ? "surface-ink bg-ink text-ink-foreground" : "bg-card hover:bg-secondary/60",
              )}
            >
              {r.name}
            </button>
          ))}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Keep it</AlertDialogCancel>
          <AlertDialogAction disabled={pending || !chosen} onClick={remove} variant="danger">
            {pending && <Loader2 className="size-4 animate-spin" />}
            Remove restaurant
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
