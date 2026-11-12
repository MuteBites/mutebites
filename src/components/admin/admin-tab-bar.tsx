"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

// More tabs (Kitchen, Handover, Analytics) join as they're built.
const TABS = [
  { href: "/admin", label: "Orders", Icon: ClipboardList },
  { href: "/admin/more", label: "More", Icon: LayoutGrid },
] as const;

/**
 * The admin's floating bottom bar (mobile-first redesign, 12 Nov 2026),
 * built like the student TabBar: mounted once in the admin layout so its
 * lit pill slides between tabs. Only on the tab pages themselves; deeper
 * pages (history, an order, menus…) have their own back link instead.
 */
export function AdminTabBar() {
  const pathname = usePathname();
  const active = TABS.findIndex((t) => t.href === pathname);
  if (active === -1) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <nav
        aria-label="Admin"
        className="pointer-events-auto relative mx-auto grid w-full max-w-sm grid-cols-2 rounded-full border bg-card/85 p-1.5 shadow-raised backdrop-blur-xl select-none"
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-1.5 left-1.5 w-[calc((100%-0.75rem)/2)] transition-transform duration-(--dur-slow) ease-spring"
          style={{ transform: `translateX(${active * 100}%)` }}
        >
          <span key={active} className="animate-tab-stretch surface-slider glow-slider block size-full rounded-full bg-slider" />
        </span>
        {TABS.map(({ href, label, Icon }, i) => {
          const on = i === active;
          return (
            <Link
              key={href}
              href={href}
              aria-current={on ? "page" : undefined}
              onClick={() => {
                if (on) window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={cn(
                "pressable relative z-10 flex h-12 items-center justify-center gap-1.5 rounded-full text-sm font-semibold outline-none transition-colors duration-(--dur-base) focus-visible:ring-3 focus-visible:ring-ring/80",
                on ? "text-slider-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon
                key={on ? "on" : "off"}
                className={cn("size-5 shrink-0", on && "animate-tab-pop")}
                strokeWidth={on ? 2.5 : 2}
                aria-hidden="true"
              />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
