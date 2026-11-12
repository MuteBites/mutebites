"use client";

import { useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Inbox, Loader2, Search, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/empty-state";
import { advanceOrderStatus, cancelOrder } from "@/lib/admin/actions";
import type { AdminOrder } from "@/lib/data/admin";
import type { OrderStatus } from "@/lib/data/types";
import { formatTime, slotEndTime } from "@/lib/date";
import { formatRupees } from "@/lib/format";
import { itemLine } from "@/lib/orders/admin-text";
import { advanceLabel, formatOrderNumber, nextStatus, statusBadge } from "@/lib/orders/status";
import { toast } from "@/lib/toast/store";
import { useNowSeconds } from "@/lib/use-now";
import { cn } from "@/lib/utils";
import { CopyOrderButton, WhatsAppButton } from "./order-card";

type Column = "new" | "confirmed" | "done";

const COLUMNS: { key: Column; label: string }[] = [
  { key: "new", label: "New" },
  { key: "confirmed", label: "Confirmed" },
  { key: "done", label: "Done" },
];

function columnOf(status: OrderStatus): Column {
  if (status === "pending") return "new";
  if (status === "delivered" || status === "cancelled") return "done";
  return "confirmed";
}

/** How far a card must be dragged to act. */
const SWIPE_AT = 96;

/**
 * The dashboard's live order board (mobile-first redesign, 12 Nov 2026):
 * New / Confirmed / Done tabs over today's current orders. Swipe a card
 * right to move it on (Confirm, then Mark delivered), left to cancel (New
 * only — once confirmed with the restaurant, the way forward is
 * delivered); the same actions are buttons on the card for keyboards and
 * anyone who'd rather tap. Every change is compare-and-swapped on the
 * status shown (advanceOrderStatus / cancelOrder), so a stale screen can't
 * skip a step. Tapping a card opens its page.
 */
export function OrderBoard({ orders, confirmedTools }: { orders: AdminOrder[]; confirmedTools?: ReactNode }) {
  const router = useRouter();
  // Statuses changed here, until the server re-fetch catches up.
  const [changed, setChanged] = useState<Record<string, OrderStatus>>({});
  const statusOf = (o: AdminOrder) => changed[o.id] ?? o.status;

  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      q
        ? orders.filter((o) =>
            `${formatOrderNumber(o.dailyNumber)} ${o.dailyNumber} ${o.studentName} ${o.contactPhone}`.toLowerCase().includes(q),
          )
        : orders,
    [orders, q],
  );

  const byColumn = (col: Column) => visible.filter((o) => columnOf(changed[o.id] ?? o.status) === col);
  const counts = Object.fromEntries(COLUMNS.map(({ key }) => [key, byColumn(key).length])) as Record<Column, number>;
  const [tab, setTab] = useState<Column>(() =>
    orders.some((o) => o.status === "pending") ? "new" : orders.some((o) => columnOf(o.status) === "confirmed") ? "confirmed" : "new",
  );

  // Orders that arrived after the board first rendered get a short glow.
  const [firstIds] = useState(() => new Set(orders.map((o) => o.id)));
  const fresh = (id: string) => !firstIds.has(id);

  const now = useNowSeconds();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<Set<string>>(() => new Set());
  const [cancelling, setCancelling] = useState<AdminOrder | null>(null);
  const [cancelPending, startCancel] = useTransition();

  function setBusyFor(id: string, on: boolean) {
    setBusy((b) => {
      const next = new Set(b);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function advance(order: AdminOrder) {
    const from = statusOf(order);
    const to = nextStatus(from);
    if (!to || busy.has(order.id)) return;
    navigator.vibrate?.(10);
    setBusyFor(order.id, true);
    setChanged((c) => ({ ...c, [order.id]: to }));
    startTransition(async () => {
      const result = await advanceOrderStatus(order.id, from);
      setBusyFor(order.id, false);
      if (result.ok) {
        toast.success(
          to === "delivered"
            ? `${formatOrderNumber(order.dailyNumber)} delivered.`
            : `${formatOrderNumber(order.dailyNumber)} confirmed. The student gets a notification.`,
        );
        router.refresh();
      } else {
        setChanged((c) => ({ ...c, [order.id]: from }));
        toast.error(result.error);
      }
    });
  }

  function confirmCancel() {
    const order = cancelling;
    if (!order) return;
    const from = statusOf(order);
    startCancel(async () => {
      const result = await cancelOrder(order.id, from);
      if (result.ok) {
        setChanged((c) => ({ ...c, [order.id]: "cancelled" }));
        setCancelling(null);
        toast.success(`${formatOrderNumber(order.dailyNumber)} cancelled.`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const list = byColumn(tab);
  const hint =
    tab === "new"
      ? "Swipe right to confirm, left to cancel"
      : tab === "confirmed"
        ? "Swipe right once it's collected"
        : "Delivered and cancelled today";

  return (
    <section aria-labelledby="board-heading">
      <h2 id="board-heading" className="sr-only">
        Current orders
      </h2>

      {orders.length > 0 && (
        <label className="relative mb-3 block">
          <span className="sr-only">Search orders</span>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Token, name or phone"
            className="h-11 w-full rounded-full border border-input bg-card pr-10 pl-10 text-base shadow-card outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/80 sm:text-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </label>
      )}

      <div
        role="tablist"
        aria-label="Order status"
        className="sticky top-2 z-20 grid grid-cols-3 gap-1 rounded-full border bg-card/90 p-1 shadow-raised backdrop-blur-xl"
      >
        {COLUMNS.map(({ key, label }) => {
          const on = tab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(key)}
              className={cn(
                "flex h-10 min-w-0 items-center justify-center gap-1 rounded-full text-[13px] font-semibold min-[360px]:gap-1.5 min-[360px]:text-sm outline-none transition-colors duration-(--dur-base) focus-visible:ring-3 focus-visible:ring-ring/80",
                on ? "surface-slider glow-slider bg-slider text-slider-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
              <span
                className={cn(
                  "min-w-5 rounded-full px-1 text-xs font-bold tabular-nums min-[360px]:min-w-6 min-[360px]:px-1.5",
                  on ? "bg-slider-foreground/20" : key === "new" && counts.new > 0 ? "bg-amber-soft text-amber-soft-foreground" : "bg-secondary",
                )}
              >
                {counts[key]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 mb-2 flex min-h-10 flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{hint}</p>
        {tab === "confirmed" && confirmedTools}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={q ? "No matching orders" : tab === "new" ? "No new orders" : tab === "confirmed" ? "Nothing waiting to go" : "Nothing done yet today"}
          compact
        >
          {q ? "Try a token number, a name or a phone number." : "New orders show up here by themselves."}
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((order) => (
            <li key={order.id}>
              <BoardCard
                order={order}
                status={statusOf(order)}
                now={now}
                fresh={fresh(order.id)}
                busy={busy.has(order.id)}
                onAdvance={() => advance(order)}
                onCancel={() => setCancelling(order)}
              />
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={cancelling !== null} onOpenChange={(open) => (!open && !cancelPending ? setCancelling(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelling && (
                <>
                  {cancelling.studentName}&apos;s order {formatOrderNumber(cancelling.dailyNumber)} from{" "}
                  {cancelling.restaurantName} will be marked cancelled, and they get a notification. This can&apos;t be
                  undone from here.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelPending}>Keep order</AlertDialogCancel>
            <AlertDialogAction disabled={cancelPending} onClick={confirmCancel} variant="danger">
              {cancelPending && <Loader2 className="size-4 animate-spin" />}
              Cancel order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function BoardCard({
  order,
  status,
  now,
  fresh,
  busy,
  onAdvance,
  onCancel,
}: {
  order: AdminOrder;
  status: OrderStatus;
  now: number | null;
  fresh: boolean;
  busy: boolean;
  onAdvance: () => void;
  onCancel: () => void;
}) {
  const canAdvance = advanceLabel(status) !== null;
  const canCancel = status === "pending";
  const toDelivered = status === "confirmed";

  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; id: number; locked: boolean } | null>(null);
  const moved = useRef(false);

  function onPointerDown(e: React.PointerEvent) {
    if (busy || (!canAdvance && !canCancel) || e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-no-swipe]")) return;
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId, locked: false };
    moved.current = false;
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const x = e.clientX - d.x;
    const y = e.clientY - d.y;
    if (!d.locked) {
      // Scrolling wins unless the finger clearly moves sideways first.
      if (Math.abs(y) > 10 && Math.abs(y) > Math.abs(x)) {
        drag.current = null;
        return;
      }
      if (Math.abs(x) < 10) return;
      d.locked = true;
      moved.current = true;
      setDragging(true);
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // The pointer already went away — the drag still works without capture.
      }
    }
    const min = canCancel ? -160 : 0;
    const max = canAdvance ? 160 : 0;
    setDx(Math.max(min, Math.min(max, x)));
  }

  function endDrag(act: boolean) {
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    if (d?.locked && act) {
      if (dx >= SWIPE_AT && canAdvance) onAdvance();
      else if (dx <= -SWIPE_AT && canCancel) onCancel();
    }
    setDx(0);
  }

  const badge = statusBadge(status);
  const minutes = now === null ? null : Math.max(0, Math.floor((now * 1000 - new Date(order.createdAt).getTime()) / 60_000));
  const pastSlot = now !== null && slotEndTime(order.createdAt).getTime() <= now * 1000;
  const armed = Math.abs(dx) >= SWIPE_AT;

  return (
    <div className="relative overflow-hidden rounded-[1.75rem]">
      {/* What's under the card while it's dragged. */}
      {dx !== 0 && (
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 flex items-center px-6 text-sm font-bold",
            dx > 0
              ? toDelivered
                ? "justify-start bg-success text-success-foreground"
                : "surface-primary justify-start bg-primary text-primary-foreground"
              : "justify-end bg-destructive text-destructive-foreground",
          )}
        >
          <span className={cn("flex items-center gap-2 transition-transform duration-(--dur-quick)", armed && "scale-110")}>
            {dx > 0 ? (
              <>
                {toDelivered ? "Delivered" : "Confirm"}
                <ArrowRight className="size-4" />
              </>
            ) : (
              <>
                <X className="size-4" />
                Cancel
              </>
            )}
          </span>
        </div>
      )}

      <article
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => endDrag(true)}
        onPointerCancel={() => endDrag(false)}
        onClickCapture={(e) => {
          // A drag ends in a click on the link underneath; swallow it.
          if (moved.current) {
            e.preventDefault();
            e.stopPropagation();
            moved.current = false;
          }
        }}
        style={{ transform: dx ? `translateX(${dx}px)` : undefined }}
        className={cn(
          "relative touch-pan-y rounded-[1.75rem] border bg-card p-3.5 shadow-card select-none",
          !dragging && "transition-transform duration-(--dur-base) ease-spring",
          fresh && "board-fresh",
          busy && "opacity-70",
        )}
      >
        <div className="flex items-start gap-3">
          <span className="surface-hero flex size-14 shrink-0 items-center justify-center rounded-2xl bg-hero font-heading text-2xl font-bold text-hero-foreground tabular-nums">
            {order.dailyNumber}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/admin/orders/${order.id}`}
                draggable={false}
                className="min-w-0 truncate rounded-md font-semibold outline-none after:absolute after:inset-0 after:rounded-[1.75rem] focus-visible:after:ring-3 focus-visible:after:ring-ring/80"
              >
                {order.studentName}
                <span className="sr-only">
                  , order {formatOrderNumber(order.dailyNumber)}, open details
                </span>
              </Link>
              <span className="shrink-0 font-heading text-lg leading-none font-bold text-primary tabular-nums">
                {formatRupees(order.totalAmount)}
              </span>
            </div>
            <p className="mt-0.5 line-clamp-2 text-sm">{order.items.map(itemLine).join(", ")}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span className="truncate">{order.restaurantName}</span>
              <span aria-hidden="true">·</span>
              <span>{formatTime(order.createdAt)}</span>
              {order.studentBanned && (
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 font-bold text-destructive">Banned</span>
              )}
              {order.discountOffer && (
                <span className="rounded-full bg-success-soft px-2 py-0.5 font-bold text-success">Offer</span>
              )}
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-3 flex items-center gap-2" data-no-swipe>
          {status === "pending" || status === "confirmed" ? (
            <AgeChip minutes={minutes} pending={status === "pending"} pastSlot={pastSlot} createdAt={order.createdAt} />
          ) : (
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", badge.className)}>{badge.label}</span>
          )}
          <span className="min-w-0 flex-1" />
          <CopyOrderButton order={order} />
          {status === "pending" && <WhatsAppButton order={order} compact />}
          {canAdvance && (
            <button
              type="button"
              onClick={onAdvance}
              disabled={busy}
              aria-label={`${advanceLabel(status)}: order ${formatOrderNumber(order.dailyNumber)}`}
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/80 disabled:opacity-70",
                toDelivered
                  ? "bg-success text-success-foreground"
                  : "surface-primary glow-amber bg-primary text-primary-foreground",
              )}
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-5" strokeWidth={2.5} />}
            </button>
          )}
        </div>
      </article>
    </div>
  );
}

/**
 * New orders: how long they've waited for a confirm — amber from 5 min,
 * red from 10. Confirmed ones: the slot they're due in, red once it's past.
 */
function AgeChip({
  minutes,
  pending,
  pastSlot,
  createdAt,
}: {
  minutes: number | null;
  pending: boolean;
  pastSlot: boolean;
  createdAt: string;
}) {
  if (minutes === null) return <span className="h-6 w-20" aria-hidden="true" />;
  if (pending) {
    return (
      <span
        className={cn(
          "rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap tabular-nums",
          minutes >= 10
            ? "bg-destructive/10 text-destructive"
            : minutes >= 5
              ? "bg-amber-soft text-amber-soft-foreground"
              : "bg-success-soft text-success",
        )}
      >
        Waiting {minutes} min
      </span>
    );
  }
  const end = slotEndTime(createdAt);
  const noSlot = end.getTime() === new Date(createdAt).getTime();
  return (
    <span
      className={cn(
        "truncate rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap",
        pastSlot && !noSlot ? "bg-destructive/10 text-destructive" : "bg-plum-soft text-plum-soft-foreground",
      )}
    >
      {noSlot ? "Time to be confirmed" : pastSlot ? `Slot ended ${formatTime(end.toISOString())}` : `Due by ${formatTime(end.toISOString())}`}
    </span>
  );
}
