"use client";

import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { AboutCredits } from "./about-credits";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/** Tapping the Home logo pops up a short "what is this app" card — mostly for first-time visitors poking around. */
export function AboutMuteBitesDialog({ children }: { children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger
        aria-label="About MuteBites"
        // Same frosted plate as the Trending button next to it, plus a thin
        // ring, so the logo reads as tappable; .logo-hint ripples twice on load.
        className="logo-hint pressable flex size-12 shrink-0 items-center justify-center rounded-2xl bg-card/80 shadow-card ring-1 ring-foreground/10 outline-none hover:ring-primary/40 focus-visible:ring-3 focus-visible:ring-ring/80"
      >
        {children}
      </DialogTrigger>
      <DialogContent className="flex flex-col items-center text-center">
        <BrandLogo className="size-16 rounded-2xl" />
        <DialogTitle className="mt-4">MuteBites</DialogTitle>
        <p className="text-sm font-semibold text-primary">Good food. Campus mood.</p>
        <DialogDescription className="mt-3 leading-relaxed">
          Food delivery built for VIT-AP campus — biryani, Indo-Chinese, fresh juices and
          fruits, veg and non-veg, from real partner restaurants near you.
        </DialogDescription>
        <p className="mt-3 text-sm text-muted-foreground">
          Cash on delivery · Pickup at VIT-AP Main Gate
          <br />
          Scan and pay through UPI too
        </p>
        <p className="mt-4 text-label text-primary">
          Fast · Reliable · Affordable
        </p>
        <AboutCredits />
      </DialogContent>
    </Dialog>
  );
}
