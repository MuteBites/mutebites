"use client";

import { useTransition } from "react";
import { Loader2, LogOut } from "lucide-react";
import { signOutAndClearCart } from "@/lib/sign-out";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => signOutAndClearCart())}
      className="flex w-full items-center justify-between font-semibold text-destructive outline-none hover:underline focus-visible:ring-2 focus-visible:ring-destructive/30 disabled:opacity-60"
    >
      {pending ? "Signing out…" : "Sign out"}
      {pending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
    </button>
  );
}
