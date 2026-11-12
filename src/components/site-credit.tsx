"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { DeveloperContact, DeveloperName } from "@/components/developer-credit";
import { cn } from "@/lib/utils";

/* Pages whose <main> ends in pb-28 for the floating tab bar: the credit
   tucks up into that space, then clears the bar itself. */
const TAB_PAGES = ["/", "/orders", "/profile"];

/**
 * "~ Made with ♥ by Naga Adithya" at the foot of every page (root layout)
 * except the admin's (left out by the client's call, 12 Nov 2026).
 * The heart beats now and then; the name has a dotted underline and folds
 * open WhatsApp · Mail, like the About popup's credit. A lucide
 * heart rather than the emoji — no emoji in the UI (they render differently
 * per phone).
 */
export function SiteCredit() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const tabPage = TAB_PAGES.includes(pathname);
  // Menus carry the cart bar at the bottom; order pages a sticky footer.
  const barPage = pathname.startsWith("/restaurants/");
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;

  return (
    <footer
      className={cn(
        "site-credit mx-auto w-full max-w-md px-6 text-center text-xs text-muted-foreground",
        tabPage ? "-mt-20 pb-28" : barPage ? "pt-6 pb-28" : "pt-6 pb-8",
      )}
    >
      <p className="flex items-center justify-center gap-1">
        ~ Made with
        <Heart className="credit-heart size-3.5 fill-current text-rose-500 dark:text-rose-300" aria-label="love" role="img" />
        by <DeveloperName open={open} onToggle={() => setOpen((o) => !o)} controls="site-credit-contact" />
      </p>
      <DeveloperContact id="site-credit-contact" open={open} />
    </footer>
  );
}
