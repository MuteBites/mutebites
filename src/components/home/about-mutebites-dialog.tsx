"use client";

import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { KaapiMotif } from "@/components/theme/kaapi-motif";
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
      <DialogContent
        // The close button sits on the hero strip, so it takes the hero's ink.
        className="flex flex-col items-center overflow-hidden text-center [&_[data-slot=dialog-close-button]]:text-hero-foreground [&_[data-slot=dialog-close-button]]:hover:bg-hero-foreground/15"
      >
        {/* A strip of the lit hero (Kaapi adds its tumbler), the logo rising out of it. */}
        <div aria-hidden="true" className="surface-hero relative -mx-6 -mt-6 h-24 self-stretch overflow-hidden bg-hero">
          <KaapiMotif className="-bottom-16 left-1/2 size-40 -translate-x-1/2" />
        </div>
        <BrandLogo className="relative -mt-10 size-18 rounded-[1.4rem] shadow-raised ring-4 ring-card" />
        <DialogTitle className="mt-3 text-title">MuteBites</DialogTitle>
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
