// All timestamps in the app are IST wall-clock times for VIT-AP students,
// regardless of what timezone the server happens to run in.
const IST = "Asia/Kolkata";

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: IST,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const timeFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: IST,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});
const dateFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: IST,
  day: "numeric",
  month: "short",
});

// Intl inserts a narrow no-break space before am/pm in en-IN and lowercases
// it; normalize both so times render as "7:42 PM" everywhere.
function time(d: Date) {
  return timeFmt.format(d).replace(/ /g, " ").replace(/am|pm/i, (m) => m.toUpperCase());
}

/** "7:42 PM" */
export function formatTime(iso: string): string {
  return time(new Date(iso));
}

/** "Today, 7:42 PM" or "11 Sep, 9:10 PM", both in IST. */
export function formatOrderTimestamp(iso: string): string {
  const d = new Date(iso);
  const isToday = dayKeyFmt.format(d) === dayKeyFmt.format(new Date());
  return isToday ? `Today, ${time(d)}` : `${dateFmt.format(d)}, ${time(d)}`;
}

const hourMinuteFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: IST,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/**
 * A rough delivery-window estimate, purely a function of when the order
 * was placed (IST wall-clock time) — no ETA is stored anywhere.
 */
export function estimatedDelivery(iso: string): string {
  const [h, m] = hourMinuteFmt.format(new Date(iso)).split(":").map(Number);
  const minutesOfDay = h * 60 + m;

  if (minutesOfDay < 12 * 60 + 40) return "Delivery by 1:30 PM";
  if (minutesOfDay <= 18 * 60) return "Delivery between 7:00 PM – 7:30 PM";
  return "Delivery before 8:20 PM";
}

/**
 * The literal end-of-slot instant for an order, based on when it was
 * placed (IST wall-clock) — the same three windows as estimatedDelivery()
 * above, just as a real Date instead of display text, so admin bulk
 * actions can gate on "has this slot actually ended" rather than go by
 * status alone.
 */
export function slotEndTime(iso: string): Date {
  const placed = new Date(iso);
  const [h, m] = hourMinuteFmt.format(placed).split(":").map(Number);
  const minutesOfDay = h * 60 + m;

  const [endHour, endMinute] =
    minutesOfDay < 12 * 60 + 40 ? [13, 30] : minutesOfDay <= 18 * 60 ? [19, 30] : [20, 20];

  const [year, month, day] = dayKeyFmt.format(placed).split("-").map(Number);
  // IST is a fixed UTC+5:30 offset (no DST) — subtract it from the
  // wall-clock time to get the actual UTC instant it corresponds to.
  return new Date(Date.UTC(year, month - 1, day, endHour, endMinute) - (5 * 60 + 30) * 60_000);
}

/** True once an order's delivery slot has actually ended (now >= slot end). */
export function isPastDeliverySlot(iso: string, now: Date = new Date()): boolean {
  return now.getTime() >= slotEndTime(iso).getTime();
}
