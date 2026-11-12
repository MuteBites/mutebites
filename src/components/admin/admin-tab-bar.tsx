"use client";

import { useRef, useState, type MouseEvent, type PointerEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChartColumn, ChefHat, ClipboardList, LayoutGrid, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin", label: "Orders", Icon: ClipboardList },
  { href: "/admin/kitchen", label: "Kitchen", Icon: ChefHat },
  { href: "/admin/delivery", label: "Delivery", Icon: Truck },
  { href: "/admin/analytics", label: "Analytics", Icon: ChartColumn },
  { href: "/admin/more", label: "More", Icon: LayoutGrid },
] as const;

/** How far a finger has to move sideways before a press becomes a drag. */
const DRAG_START_PX = 8;

type Drag = { pointerId: number; startX: number; dragging: boolean };

/**
 * The admin's floating bottom bar (mobile-first redesign, 12 Nov 2026),
 * mounted once in the admin layout and built like the student TabBar:
 *
 * - Tap a tab: the lit pill slides there straight away (it doesn't wait
 *   for the next page to load) and the page follows.
 * - It's a real slider: press anywhere on the bar and slide sideways — the
 *   pill lifts and follows your finger, the tab under it lights up with a
 *   tiny buzz, and letting go opens that tab. A press that doesn't move
 *   sideways is an ordinary tap; vertical movement still scrolls
 *   (touch-action: pan-y). Keyboard users get the plain links.
 * - Tapping the tab you're on scrolls back to the top.
 *
 * Only on the tab pages themselves; deeper pages (history, an order,
 * menus…) have their own back link instead.
 */
export function AdminTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);
  const dragRef = useRef<Drag | null>(null);
  // Swallow the click that follows a drag's pointerup.
  const suppressClickRef = useRef(false);
  // While dragging: the pill's left edge (px from the first slot) and the tab under it.
  const [held, setHeld] = useState<{ x: number; tab: number } | null>(null);
  // A tab tapped / slid to whose page hasn't arrived yet — only counts while
  // we're still on the page it was chosen from.
  const [going, setGoing] = useState<{ tab: number; from: string } | null>(null);

  const active = TABS.findIndex((t) => t.href === pathname);
  if (active === -1) return null;

  const target = going && going.from === pathname ? going.tab : active;

  function go(tab: number) {
    if (tab === active) return;
    setGoing({ tab, from: pathname });
    router.push(TABS[tab].href);
  }

  /** The width of one tab slot (the pill is exactly one slot wide). */
  function slotWidth() {
    const nav = navRef.current;
    if (!nav) return 0;
    const pad = parseFloat(getComputedStyle(nav).paddingLeft) || 6;
    return (nav.clientWidth - pad * 2) / TABS.length;
  }

  /** The pill's left edge (px from the first slot) centred under the finger, clamped to the bar. */
  function pillXFor(clientX: number) {
    const nav = navRef.current!;
    const slot = slotWidth();
    const pad = parseFloat(getComputedStyle(nav).paddingLeft) || 6;
    const x = clientX - nav.getBoundingClientRect().left - pad - slot / 2;
    return Math.min(Math.max(x, 0), slot * (TABS.length - 1));
  }

  function onPointerDown(e: PointerEvent<HTMLElement>) {
    if (e.button !== 0) return;
    dragRef.current = { pointerId: e.pointerId, startX: e.clientX, dragging: false };
  }

  function onPointerMove(e: PointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (!drag.dragging) {
      if (Math.abs(e.clientX - drag.startX) < DRAG_START_PX) return;
      drag.dragging = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // The pointer already went away — the drag still works without capture.
      }
    }
    const x = pillXFor(e.clientX);
    const tab = Math.round(x / Math.max(slotWidth(), 1));
    if (tab !== (held?.tab ?? target)) navigator.vibrate?.(8);
    setHeld({ x, tab });
  }

  function endDrag(e: PointerEvent<HTMLElement>, commit: boolean) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    if (!drag.dragging) return;
    suppressClickRef.current = true;
    const tab = Math.round(pillXFor(e.clientX) / Math.max(slotWidth(), 1));
    setHeld(null);
    if (commit) go(tab);
  }

  function onLinkClick(event: MouseEvent<HTMLAnchorElement>, index: number) {
    event.preventDefault();
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (index === active) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      return;
    }
    go(index);
  }

  const dragging = held !== null;
  const lit = held?.tab ?? target;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <nav
        ref={navRef}
        aria-label="Admin"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => endDrag(e, true)}
        onPointerCancel={(e) => endDrag(e, false)}
        className="pointer-events-auto relative mx-auto grid w-full max-w-lg touch-pan-y grid-cols-5 rounded-full border bg-card/85 p-1.5 shadow-raised backdrop-blur-xl select-none"
      >
        {/* The lit pill: slides between tabs (whole tab widths), or follows
            the finger 1:1 while dragged; the inner span squashes as it lands
            and lifts while held. */}
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-1.5 left-1.5 w-[calc((100%-0.75rem)/5)]",
            !dragging && "transition-transform duration-(--dur-slow) ease-spring",
          )}
          style={{ transform: held ? `translateX(${held.x}px)` : `translateX(${target * 100}%)` }}
        >
          <span
            key={target}
            className={cn(
              "animate-tab-stretch surface-slider glow-slider block size-full rounded-full bg-slider transition-transform duration-(--dur-quick)",
              dragging && "scale-x-105 scale-y-110",
            )}
          />
        </span>
        {TABS.map(({ href, label, Icon }, i) => {
          const isActive = i === active;
          const isLit = i === lit;
          return (
            <Link
              key={href}
              href={href}
              draggable={false}
              aria-current={isActive ? "page" : undefined}
              onClick={(event) => onLinkClick(event, i)}
              className={cn(
                "pressable relative z-10 flex h-14 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-semibold outline-none transition-colors duration-(--dur-base) focus-visible:ring-3 focus-visible:ring-ring/80",
                isLit ? "text-slider-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon
                key={isLit ? "on" : "off"}
                className={cn("size-5 shrink-0", isLit && "animate-tab-pop")}
                strokeWidth={isLit ? 2.5 : 2}
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
