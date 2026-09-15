"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Badge } from "@/components/ui/badge";
import { signOutAndClearCart } from "@/lib/sign-out";

export function AdminHeader() {
  const [signingOut, startSignOut] = useTransition();

  return (
    <header className="flex items-center gap-3">
      <BrandLogo className="size-11 rounded-xl" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h1 className="truncate font-heading text-lg font-bold tracking-tight">MuteBites Ops</h1>
          <Badge variant="secondary" className="bg-ink text-ink-foreground">
            ADMIN
          </Badge>
        </div>
        <p className="truncate text-sm text-muted-foreground">
          Live operations · VIT-AP Main Gate
        </p>
      </div>
      <button
        type="button"
        disabled={signingOut}
        onClick={() => startSignOut(() => signOutAndClearCart())}
        className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-60"
      >
        <LogOut className="size-4" />
        <span className="hidden sm:inline">{signingOut ? "Signing out…" : "Sign out"}</span>
      </button>
    </header>
  );
}
