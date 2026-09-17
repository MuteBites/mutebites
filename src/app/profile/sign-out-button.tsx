"use client";

import { useTransition } from "react";
import { Loader2, LogOut } from "lucide-react";
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
import { signOutAndClearCart } from "@/lib/sign-out";
import { toast } from "@/lib/toast/store";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger
        aria-label="Sign out"
        className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive outline-none hover:bg-destructive/15 focus-visible:ring-2 focus-visible:ring-destructive/30"
      >
        <LogOut className="size-5" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>We&apos;re missing you already 😭</AlertDialogTitle>
          <AlertDialogDescription>Are you sure you want to log out?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => toast.success("Glad to have you back!")}>
            No
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={() => startTransition(() => signOutAndClearCart())}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            Yes, sign out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
