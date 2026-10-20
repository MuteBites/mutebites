"use client";

import { useState } from "react";
import { DeveloperContact, DeveloperName } from "@/components/developer-credit";

/** Who's behind the app — the About dialog's footer. */
const OWNERS = "Harsha & Rishi";

/**
 * "Owned by …" and "Developed & maintained by <name>". The name carries a
 * dotted underline (solid on hover) so it reads as tappable; tapping it
 * quietly opens a small "Call · WhatsApp · Mail" line underneath, and
 * tapping again folds it away (shared with the page footer, SiteCredit).
 */
export function AboutCredits() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-5 text-xs text-muted-foreground">
      <p>
        Owned by <span className="font-semibold text-foreground/80">{OWNERS}</span>
      </p>
      <p className="mt-1">
        ~ Developed &amp; Maintained by{" "}
        <DeveloperName open={open} onToggle={() => setOpen((o) => !o)} controls="about-dev-contact" />
      </p>
      <DeveloperContact id="about-dev-contact" open={open} />
      <p className="mt-3">~ mutebites</p>
    </div>
  );
}
