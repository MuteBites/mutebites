"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions";
import { BrandLogo } from "@/components/brand-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatStoredMobile } from "@/lib/phone";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts.at(-1)![0] : "")).toUpperCase();
}

export function HomeHeader({
  fullName,
  email,
  phone,
}: {
  fullName: string;
  email: string;
  phone: string;
}) {
  const [signingOut, startSignOut] = useTransition();

  return (
    <header className="flex items-center gap-3">
      <BrandLogo className="size-14 rounded-2xl" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-muted-foreground">
          Hey {fullName} <span aria-hidden="true">👋</span>
        </p>
        <h1 className="font-heading text-xl font-bold tracking-tight">What are we eating?</h1>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Account menu"
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-lg font-bold text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          {initials(fullName)}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 rounded-xl p-1.5">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-2 py-2">
              <span className="block text-sm font-semibold text-foreground">{fullName}</span>
              <span className="block truncate">{email}</span>
              <span className="block">{formatStoredMobile(phone)}</span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={signingOut}
            onClick={() => startSignOut(() => signOut())}
            className="px-2 py-2"
          >
            <LogOut />
            {signingOut ? "Signing out…" : "Sign out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
