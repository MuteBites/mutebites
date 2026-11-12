import type { ReactNode } from "react";
import { Banknote, CircleCheck, CircleX, ReceiptText } from "lucide-react";
import { HeroMotif } from "@/components/theme/hero-motif";
import { formatRupees } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SlotCountdown } from "./slot-countdown";

/*
 * The dashboard's one plum block (mobile-first redesign, 12 Nov 2026): the
 * running delivery slot counting down, with how many open orders are due
 * in it, quick chips (restaurants on, offers on) and — via `children` — the
 * campus Open / Closed switch as its footer row.
 */
export function StatCards({
  todayLabel,
  openOrders,
  activeRestaurants,
  totalRestaurants,
  offersOn,
  children,
}: {
  /** "Sat 19 Sep" — shown under the heading. */
  todayLabel: string;
  /** Every order not yet delivered or cancelled — for the slot countdown. */
  openOrders: { createdAt: string }[];
  activeRestaurants: number;
  totalRestaurants: number;
  /** Short names of the offers switched on ("10% off"). */
  offersOn: string[];
  /** Footer row — the ordering kill switch. */
  children?: ReactNode;
}) {
  return (
    <section className="surface-hero glow-hero relative overflow-hidden rounded-3xl bg-hero text-hero-foreground">
      <HeroMotif className="-top-3 right-2 size-24 opacity-80" />
      <div className="relative px-5 pt-5 sm:px-6">
        <h2 className="font-heading text-title font-bold">Today</h2>
        <p className="text-sm text-hero-foreground/85">{todayLabel} · VIT-AP Main Gate</p>
      </div>
      <div className="relative px-5 pt-4 pb-5 sm:px-6">
        <SlotCountdown openOrders={openOrders} />
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip>
            {activeRestaurants}/{totalRestaurants} restaurants on
          </Chip>
          {offersOn.map((o) => (
            <Chip key={o}>{o} on</Chip>
          ))}
        </div>
      </div>
      {children && <div className="relative border-t border-hero-foreground/15 px-5 py-4 sm:px-6">{children}</div>}
    </section>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-hero-foreground/12 px-3 py-1 text-xs font-semibold text-hero-foreground rim-light">
      {children}
    </span>
  );
}

/**
 * Today's numbers as tiles under the Today card: a swipeable row on a
 * phone, four across from sm up. "To collect" is every undelivered order's
 * total, any day — it's all still owed (pay on delivery).
 */
export function TodayTiles({
  total,
  delivered,
  cancelled,
  toCollect,
}: {
  total: number;
  delivered: number;
  cancelled: number;
  toCollect: { orders: number; amount: number };
}) {
  const tiles = [
    { label: "Orders today", value: String(total), note: null, Icon: ReceiptText, tone: "" },
    {
      label: "To collect",
      value: formatRupees(toCollect.amount),
      note: `${toCollect.orders} not delivered`,
      Icon: Banknote,
      tone: "text-primary",
    },
    { label: "Delivered", value: String(delivered), note: null, Icon: CircleCheck, tone: "text-success" },
    { label: "Cancelled", value: String(cancelled), note: null, Icon: CircleX, tone: "text-destructive" },
  ];
  return (
    <dl className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">
      {tiles.map(({ label, value, note, Icon, tone }) => (
        <div
          key={label}
          className="flex w-36 shrink-0 snap-start flex-col-reverse justify-end rounded-3xl border bg-card p-3.5 shadow-card sm:w-auto"
        >
          <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Icon className={cn("size-4 shrink-0", tone)} aria-hidden="true" />
            {label}
          </dt>
          <dd className="mb-1">
            <span className={cn("block font-heading text-2xl font-bold tabular-nums", tone)}>{value}</span>
            {note && <span className="text-xs text-muted-foreground">{note}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
