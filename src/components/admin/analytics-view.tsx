import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { BadgePercent, Star, TrendingDown, TrendingUp, UserPlus, Users } from "lucide-react";
import { ANALYTICS_RANGES, type Analytics, type AnalyticsRange } from "@/lib/data/analytics";
import { formatRupees } from "@/lib/format";
import { OFFERS } from "@/lib/offers";
import { cn } from "@/lib/utils";
import { HeroMotif } from "@/components/theme/hero-motif";
import { AnalyticsExport } from "./analytics-export";
import { CountUp, type CountKind } from "./count-up";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dayFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
const weekdayFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", timeZone: "UTC" });

/** "1 PM", "11 AM". */
function hourLabel(h: number) {
  const suffix = h < 12 ? "AM" : "PM";
  return `${h % 12 === 0 ? 12 : h % 12} ${suffix}`;
}

/**
 * The admin's Analytics tab (mobile admin step 4, 12 Nov 2026), drawn
 * server-side from public.admin_order_analytics(): range chips, headline
 * tiles against the previous period, orders over time, busiest hours,
 * restaurants, top dishes, offers and ratings. One series per chart in a
 * single hue (amber, the action colour), values on hover (title) and in
 * screen-reader tables, so nothing is colour alone.
 */
export function AnalyticsView({
  range,
  students,
  current: a,
  previous: p,
  fromIso,
}: {
  range: AnalyticsRange;
  /** Everyone registered, all time. */
  students: number;
  current: Analytics;
  previous: Analytics | null;
  fromIso: string;
}) {
  const vs = ANALYTICS_RANGES.find((r) => r.key === range)?.previous ?? "";
  const avg = a.orders ? a.booked / a.orders : 0;
  const prevAvg = p && p.orders ? p.booked / p.orders : null;
  const repeat = a.customers ? (a.repeatCustomers / a.customers) * 100 : 0;
  const prevRepeat = p && p.customers ? (p.repeatCustomers / p.customers) * 100 : null;
  const cancelRate = a.orders + a.cancelled ? (a.cancelled / (a.orders + a.cancelled)) * 100 : 0;
  const prevCancelRate = p && p.orders + p.cancelled ? (p.cancelled / (p.orders + p.cancelled)) * 100 : null;

  return (
    <>
      <nav aria-label="Date range" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {ANALYTICS_RANGES.map((r) => {
          const on = r.key === range;
          return (
            <Link
              key={r.key}
              href={r.key === "7" ? "/admin/analytics" : `/admin/analytics?range=${r.key}`}
              scroll={false}
              aria-current={on ? "page" : undefined}
              className={cn(
                "flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/80",
                on ? "surface-ink border-transparent bg-ink text-ink-foreground" : "bg-card shadow-card",
              )}
            >
              {r.label}
            </Link>
          );
        })}
      </nav>

      <RevenueHero a={a} delta={change(a.revenue, p?.revenue)} label={ANALYTICS_RANGES.find((r) => r.key === range)?.label ?? ""} />

      <StudentsCard total={students} joined={a.newStudents} label={ANALYTICS_RANGES.find((r) => r.key === range)?.label ?? ""} />

      <section aria-label="Headline numbers">
        <dl className="grid grid-cols-2 gap-3">
          <Kpi i={0} label="Orders" value={a.orders} delta={change(a.orders, p?.orders)} />
          <Kpi i={1} label="Students ordered" value={a.customers} delta={change(a.customers, p?.customers)} />
          <Kpi i={2} label="Average order" value={avg} kind="rupees" delta={change(avg, prevAvg)} />
          <Kpi i={3} label="New students" value={a.newStudents} delta={change(a.newStudents, p?.newStudents)} />
          <Kpi
            i={4}
            label="Ordered again"
            note={`${a.repeatCustomers} of ${a.customers} students`}
            value={repeat}
            kind="percent"
            delta={points(repeat, prevRepeat)}
          />
          <Kpi
            i={5}
            label="Cancelled"
            note={`${a.cancelled} orders`}
            value={cancelRate}
            kind="percent"
            delta={points(cancelRate, prevCancelRate)}
            lowerIsBetter
          />
        </dl>
        <p className="mt-2 text-xs text-muted-foreground">Arrows compare with {vs}.</p>
      </section>

      {range === "today" ? <OrdersByHour a={a} /> : <OrdersByDay a={a} fromIso={fromIso} days={Number(range)} />}
      {range !== "today" && <BusiestTimes a={a} />}

      <Card title="Restaurants" note="Orders and value booked, cancelled left out">
        {a.byRestaurant.length === 0 ? (
          <Empty />
        ) : (
          <ul className="flex flex-col gap-3">
            {a.byRestaurant.map((r, i) => (
              <li key={r.name} title={`${r.name}: ${r.orders} orders, ${formatRupees(r.revenue)}`}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-semibold">{r.name}</span>
                  <span className="shrink-0 tabular-nums">
                    {formatRupees(r.revenue)} <span className="text-muted-foreground">· {r.orders}</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 rounded-full bg-secondary">
                  <div
                    className="ana-grow-x h-full rounded-full bg-primary"
                    style={
                      { width: `${Math.max(2, (r.revenue / a.byRestaurant[0].revenue) * 100)}%`, "--i": i } as CSSProperties
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Top dishes" note="By quantity, and how many students ordered each">
        {a.topDishes.length === 0 ? (
          <Empty />
        ) : (
          <ol className="divide-y">
            {a.topDishes.map((d, i) => (
              <li key={d.name} className="ana-rise flex items-center gap-3 py-2.5" style={{ "--i": i } as CSSProperties}>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-soft text-xs font-bold text-amber-soft-foreground">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate">{d.name}</span>
                <span className="shrink-0 text-right text-sm tabular-nums">
                  <span className="font-bold">× {d.quantity}</span>
                  <span className="block text-xs text-muted-foreground">
                    {d.students} {d.students === 1 ? "student" : "students"}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card title="Offers used">
          {a.offers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No offers used in this range.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {a.offers.map((o) => (
                <li key={o.offer} className="flex items-center gap-3 text-sm">
                  <BadgePercent className="size-4 shrink-0 text-success" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{OFFERS[o.offer]?.short ?? o.offer}</span>
                  <span className="shrink-0 tabular-nums">
                    {o.orders} · −{formatRupees(o.discount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Ratings" note="Average stars, lowest first">
          {a.ratings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No ratings in this range.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {a.ratings.map((r) => (
                <li key={r.name} className="flex items-center gap-3 text-sm">
                  <Star
                    className={cn("size-4 shrink-0", r.average <= 3 ? "text-destructive" : "text-primary")}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate">{r.name}</span>
                  <span className="shrink-0 tabular-nums">
                    <span className="font-bold">{r.average.toFixed(1)}</span>
                    <span className="text-muted-foreground"> · {r.ratings}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <AnalyticsExport range={range} label={ANALYTICS_RANGES.find((r) => r.key === range)?.label ?? "this range"} />
    </>
  );
}

type Delta = { text: string; up: boolean } | null;

/** "+12%" against the previous period; "new" when it was 0. */
function change(now: number, before: number | null | undefined): Delta {
  if (before === null || before === undefined) return null;
  if (before === 0) return now === 0 ? null : { text: "New", up: true };
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) return { text: "Same", up: true };
  return { text: `${pct > 0 ? "+" : ""}${pct}%`, up: pct > 0 };
}

/** A difference in percentage points, for rates. */
function points(now: number, before: number | null): Delta {
  if (before === null) return null;
  const d = Math.round(now - before);
  if (d === 0) return { text: "Same", up: true };
  return { text: `${d > 0 ? "+" : ""}${d} pts`, up: d > 0 };
}

function Kpi({
  i,
  label,
  value,
  kind = "int",
  note,
  delta,
  lowerIsBetter = false,
}: {
  /** Order on screen — staggers the rise and the count-up. */
  i: number;
  label: string;
  value: number;
  kind?: CountKind;
  note?: string;
  delta: Delta;
  lowerIsBetter?: boolean;
}) {
  const same = delta?.text === "Same";
  const good = delta && !same ? delta.up !== lowerIsBetter : null;
  return (
    <div
      className="ana-rise flex flex-col-reverse justify-end rounded-3xl border bg-card p-3.5 shadow-card"
      style={{ "--i": i + 1 } as CSSProperties}
    >
      <dt className="text-sm text-muted-foreground">
        {label}
        {note && <span className="block text-xs">{note}</span>}
      </dt>
      <dd className="mb-1 flex flex-wrap items-baseline gap-x-2">
        <span className="font-heading text-2xl font-bold tabular-nums">
          <CountUp value={value} kind={kind} delay={120 + i * 70} />
        </span>
        {delta && (
          <span
            style={{ "--i": i + 4 } as CSSProperties}
            className={cn(
              "ana-pop inline-flex items-center gap-0.5 text-xs font-bold",
              good === null ? "text-muted-foreground" : good ? "text-success" : "text-destructive",
            )}
          >
            {!same && (delta.up ? <TrendingUp className="size-3.5" aria-hidden="true" /> : <TrendingDown className="size-3.5" aria-hidden="true" />)}
            {delta.text}
          </span>
        )}
      </dd>
    </div>
  );
}

function Card({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="ana-rise rounded-3xl border bg-card p-4 shadow-card" style={{ "--i": 7 } as CSSProperties}>
      <h2 className="font-heading text-lg font-bold">{title}</h2>
      {note && <p className="text-sm text-muted-foreground">{note}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Empty() {
  return <p className="text-sm text-muted-foreground">No orders in this range yet.</p>;
}

/** Vertical bars, one series; the tallest bar's value is printed, the rest are on hover and in the table. */
function Bars({ bars, caption }: { bars: { label: string; short: string; value: number }[]; caption: string }) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  const every = bars.length > 14 ? 5 : bars.length > 8 ? 2 : 1;
  const top = bars.findIndex((b) => b.value === max);
  return (
    <>
      <div className="flex h-40 items-end gap-0.5" aria-hidden="true">
        {bars.map((b, i) => (
          <div key={b.label} className="group relative flex h-full min-w-0 flex-1 flex-col justify-end" title={`${b.label}: ${b.value}`}>
            {i === top && b.value > 0 && (
              <span className="ana-pop mb-1 text-center text-xs font-bold tabular-nums" style={{ "--i": bars.length + 8 } as CSSProperties}>
                {b.value}
              </span>
            )}
            <div
              className="ana-grow-y rounded-t-[4px] bg-primary transition-opacity group-hover:opacity-80"
              style={{ height: `${(b.value / max) * 100}%`, minHeight: b.value ? 2 : 0, "--i": i } as CSSProperties}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-0.5 border-t pt-1 text-[10px] text-muted-foreground" aria-hidden="true">
        {bars.map((b, i) => (
          <span key={b.label} className="min-w-0 flex-1 text-center whitespace-nowrap">
            {i % every === 0 ? b.short : ""}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{caption}</caption>
        <tbody>
          {bars.map((b) => (
            <tr key={b.label}>
              <th scope="row">{b.label}</th>
              <td>{b.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function OrdersByDay({ a, fromIso, days }: { a: Analytics; fromIso: string; days: number }) {
  const byDay = new Map(a.byDay.map((d) => [d.day, d.orders]));
  // fromIso is IST midnight; +5:30 gives the IST calendar date as a UTC date.
  const start = new Date(fromIso).getTime() + (5 * 60 + 30) * 60_000;
  const bars = Array.from({ length: days }, (_, i) => {
    const date = new Date(start + i * DAY_MS);
    const key = date.toISOString().slice(0, 10);
    return {
      label: `${weekdayFmt.format(date)} ${dayFmt.format(date)}`,
      short: days <= 7 ? weekdayFmt.format(date) : String(date.getUTCDate()),
      value: byDay.get(key) ?? 0,
    };
  });
  return (
    <Card title="Orders per day">
      <Bars bars={bars} caption="Orders per day" />
    </Card>
  );
}

function OrdersByHour({ a }: { a: Analytics }) {
  const byHour = new Map<number, number>();
  for (const h of a.byHour) byHour.set(h.hour, (byHour.get(h.hour) ?? 0) + h.orders);
  const hours = [...byHour.keys()];
  const first = Math.min(11, ...hours);
  const last = Math.max(21, ...hours);
  const bars = Array.from({ length: last - first + 1 }, (_, i) => {
    const h = first + i;
    return { label: hourLabel(h), short: String(h % 12 === 0 ? 12 : h % 12), value: byHour.get(h) ?? 0 };
  });
  return (
    <Card title="Orders by hour" note="Today so far">
      <Bars bars={bars} caption="Orders by hour today" />
    </Card>
  );
}

/** Weekday × hour grid, one hue (amber), darker = more orders. Every hour from the first to the last that had orders, so quiet gaps show. */
function BusiestTimes({ a }: { a: Analytics }) {
  if (a.byHour.length === 0) return null;
  const seen = a.byHour.map((h) => h.hour);
  const first = Math.min(...seen);
  const hours = Array.from({ length: Math.max(...seen) - first + 1 }, (_, i) => first + i);
  const cell = new Map(a.byHour.map((h) => [`${h.dow}-${h.hour}`, h.orders]));
  const max = Math.max(1, ...a.byHour.map((h) => h.orders));
  return (
    <Card title="Busiest times" note="Darker = more orders">
      <div className="overflow-x-auto [scrollbar-width:thin]">
        <table className="w-full border-separate border-spacing-1 text-[10px] text-muted-foreground">
          <thead>
            <tr>
              <th scope="col" className="sr-only">
                Day
              </th>
              {hours.map((h) => (
                <th key={h} scope="col" className="font-normal whitespace-nowrap">
                  {hourLabel(h).replace(" ", "")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WEEKDAYS.map((day, i) => (
              <tr key={day}>
                <th scope="row" className="pr-1 text-left font-normal">
                  {day}
                </th>
                {hours.map((h, j) => {
                  const v = cell.get(`${i + 1}-${h}`) ?? 0;
                  return (
                    <td key={h} title={`${day} ${hourLabel(h)}: ${v} orders`} className="p-0">
                      <span
                        className={cn("ana-pop block h-6 min-w-6 rounded-[4px]", v ? "bg-primary" : "bg-secondary")}
                        style={{ ...(v ? { opacity: 0.2 + 0.8 * (v / max) } : {}), "--i": i + j * 2 } as CSSProperties}
                      >
                        <span className="sr-only">{v}</span>
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/**
 * The page's lit hero: the range's revenue (delivered orders) counting up,
 * its change, and a sparkline of orders over the range that draws itself
 * left to right (a clip rect growing — dash tricks break with the
 * non-scaling stroke) with a soft area fading in.
 */
function RevenueHero({ a, delta, label }: { a: Analytics; delta: Delta; label: string }) {
  // Orders per day, or per hour for a single day (fewer than 2 days of data).
  const series = a.byDay.length > 1 ? a.byDay.map((d) => d.orders) : hourSeries(a);
  const max = Math.max(1, ...series);
  const pts = series.map((v, i) => [series.length === 1 ? 50 : (i / (series.length - 1)) * 100, 36 - (v / max) * 30]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = pts.length > 1 ? `${line} L100,40 L0,40 Z` : "";
  const up = delta?.text !== "Same" && delta?.up;

  return (
    <section className="ana-rise surface-hero glow-hero relative overflow-hidden rounded-3xl bg-hero text-hero-foreground">
      <HeroMotif className="-top-3 right-2 size-24 opacity-70" />
      <div className="relative px-5 pt-5">
        <p className="text-sm text-hero-foreground/85">Revenue · {label}</p>
        <p className="mt-1 font-heading text-5xl leading-none font-bold tabular-nums">
          <CountUp value={a.revenue} kind="rupees" ms={1400} />
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-hero-foreground/85">
          {delta && (
            <span
              className={cn(
                "ana-pop inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold",
                delta.text === "Same" ? "bg-hero-foreground/12" : up ? "bg-hero-success/20 text-hero-success" : "bg-hero-danger/15 text-hero-danger",
              )}
              style={{ "--i": 10 } as CSSProperties}
            >
              {delta.text !== "Same" && (up ? <TrendingUp className="size-4" aria-hidden="true" /> : <TrendingDown className="size-4" aria-hidden="true" />)}
              {delta.text}
            </span>
          )}
          <span>
            {a.delivered} delivered · {formatRupees(a.booked)} booked
          </span>
        </p>
      </div>
      {pts.length > 1 && (
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="relative mt-3 block h-20 w-full" aria-hidden="true">
          <defs>
            <clipPath id="ana-spark-reveal">
              <rect className="ana-reveal" x="0" y="0" width="100" height="40" />
            </clipPath>
          </defs>
          <g clipPath="url(#ana-spark-reveal)">
            <path d={area} className="ana-area fill-hero-accent/20" />
            <path
              d={line}
              className="fill-none stroke-hero-accent"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        </svg>
      )}
      {pts.length <= 1 && <div className="h-5" />}
    </section>
  );
}

function hourSeries(a: Analytics): number[] {
  const byHour = new Map<number, number>();
  for (const h of a.byHour) byHour.set(h.hour, (byHour.get(h.hour) ?? 0) + h.orders);
  return Array.from({ length: 12 }, (_, i) => byHour.get(10 + i) ?? 0);
}

/** The next round number to aim for: 500s up to 2,000, then 1,000s. */
function nextMilestone(n: number) {
  const step = n < 2000 ? 500 : 1000;
  return (Math.floor(n / step) + 1) * step;
}

/**
 * Everyone on MuteBites, all time: the count rolls up, the range's new
 * students pop in as a chip, and a bar fills towards the next round number
 * ("158 to 1,500"), its last stretch glowing.
 */
function StudentsCard({ total, joined, label }: { total: number; joined: number; label: string }) {
  const goal = nextMilestone(total);
  const step = goal < 2000 ? 500 : 1000;
  const pct = ((total - (goal - step)) / step) * 100;
  return (
    <section
      aria-label="Students"
      className="ana-rise relative overflow-hidden rounded-3xl border bg-card p-4 shadow-card"
      style={{ "--i": 1 } as CSSProperties}
    >
      <div className="flex items-center gap-4">
        <span className="ana-pop flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand-soft-foreground" style={{ "--i": 2 } as CSSProperties}>
          <Users className="size-7" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">Students on MuteBites</p>
          <p className="font-heading text-4xl leading-none font-bold tabular-nums">
            <CountUp value={total} ms={1600} delay={150} />
          </p>
        </div>
        {joined > 0 && (
          <span
            className="ana-pop inline-flex shrink-0 items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-bold text-success"
            style={{ "--i": 14 } as CSSProperties}
          >
            <UserPlus className="size-3.5" aria-hidden="true" />+{joined}
            <span className="sr-only"> joined in {label.toLowerCase()}</span>
          </span>
        )}
      </div>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="ana-grow-x h-full rounded-full bg-[linear-gradient(90deg,var(--brand-1),var(--brand-2),var(--brand-3))]"
          style={{ width: `${Math.max(3, pct)}%`, "--i": 2 } as CSSProperties}
        />
      </div>
      <p className="mt-1.5 flex justify-between text-xs text-muted-foreground">
        <span>{joined > 0 ? `+${joined} joined · ${label}` : `No new students · ${label}`}</span>
        <span className="tabular-nums">
          {(goal - total).toLocaleString("en-IN")} to {goal.toLocaleString("en-IN")}
        </span>
      </p>
    </section>
  );
}
