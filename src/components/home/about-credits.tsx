"use client";

import { useState } from "react";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

/** Who's behind the app — the About dialog's footer. */
const OWNERS = "Harsha & Rishi";
const DEVELOPER = {
  name: "Naga Adithya",
  phone: "+919032563455",
  email: "nagaadithya999@gmail.com",
};

/**
 * "Owned by …" and "Developed & maintained by <name>". The name carries a
 * dotted underline (solid on hover) so it reads as tappable; tapping it quietly opens a
 * small "Call · WhatsApp · Mail" line underneath, and tapping again folds it away.
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
        <button
          type="button"
          aria-expanded={open}
          aria-controls="about-dev-contact"
          onClick={() => setOpen((o) => !o)}
          className="rounded-sm font-semibold text-foreground/80 underline decoration-dotted decoration-1 underline-offset-4 outline-none hover:text-foreground hover:decoration-solid focus-visible:ring-2 focus-visible:ring-ring/80"
        >
          {DEVELOPER.name}
        </button>
      </p>
      <div
        id="about-dev-contact"
        className={cn(
          "grid transition-[grid-template-rows] duration-(--dur-base) ease-out-expo",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <p
            className={cn(
              "flex items-center justify-center gap-3 pt-2 transition-[opacity,translate] duration-(--dur-base) ease-out-expo",
              open ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
            )}
          >
            <a
              href={`tel:${DEVELOPER.phone}`}
              tabIndex={open ? 0 : -1}
              className="flex items-center gap-1 rounded-sm text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/80"
            >
              <Phone className="size-3.5" aria-hidden="true" />
              Call
            </a>
            <span aria-hidden="true">·</span>
            <a
              href={`https://wa.me/${DEVELOPER.phone.replace("+", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={open ? 0 : -1}
              className="flex items-center gap-1 rounded-sm text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/80"
            >
              <MessageCircle className="size-3.5" aria-hidden="true" />
              WhatsApp
            </a>
            <span aria-hidden="true">·</span>
            <a
              href={`mailto:${DEVELOPER.email}`}
              tabIndex={open ? 0 : -1}
              className="flex items-center gap-1 rounded-sm text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/80"
            >
              <Mail className="size-3.5" aria-hidden="true" />
              Mail
            </a>
          </p>
        </div>
      </div>
      <p className="mt-3">~ mutebites</p>
    </div>
  );
}
