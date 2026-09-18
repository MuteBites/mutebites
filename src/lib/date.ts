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
 * was placed (IST wall-clock time) — no ETA is stored anywhere. Split into
 * a lead-in and the time itself so the UI can keep the time on one line
 * ("before 8:20 PM" was wrapping as "8:20 / PM"); the spaces inside `time`
 * are no-break for the same reason.
 */
export function deliveryWindow(iso: string): { lead: string; time: string } {
  const [h, m] = hourMinuteFmt.format(new Date(iso)).split(":").map(Number);
  const minutesOfDay = h * 60 + m;

  if (minutesOfDay < 12 * 60 + 40) return { lead: "Delivery by", time: "1:30\u00a0PM" };
  if (minutesOfDay <= 18 * 60) return { lead: "Delivery between", time: "7:00\u2013\u20097:30\u00a0PM" };
  return { lead: "Delivery before", time: "8:20\u00a0PM" };
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

const weekdayFmt = new Intl.DateTimeFormat("en-US", { timeZone: IST, weekday: "long" });

/** True on Thursdays, IST wall-clock — powers the Thursday-special nudge on Home. */
export function isThursdayIST(now: Date = new Date()): boolean {
  return weekdayFmt.format(now) === "Thursday";
}

const adminDayFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: IST,
  weekday: "long",
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Stable per-IST-day grouping key, e.g. "2026-09-17" — for the admin order-history grouping. */
export function istDayKey(iso: string): string {
  return dayKeyFmt.format(new Date(iso));
}

/** "Wednesday, 17 Sep 2026" — IST calendar day, for the admin order-history section headings. */
export function formatAdminDay(iso: string): string {
  return adminDayFmt.format(new Date(iso));
}

// Built from en-US parts: en-IN and en-GB both abbreviate September as
// "Sept" in current ICU, which reads like a typo next to "Aug"/"Oct".
const dayHeadingFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: IST,
  weekday: "short",
  day: "numeric",
  month: "short",
});

/**
 * "Today", "Yesterday", or "Wed 17 Sep" (plus the year once it isn't this
 * year) — IST calendar day, for the student orders list's date groups.
 */
export function formatDayHeading(iso: string, now: Date = new Date()): string {
  const key = istDayKey(iso);
  if (key === dayKeyFmt.format(now)) return "Today";
  if (key === dayKeyFmt.format(new Date(now.getTime() - 24 * 60 * 60 * 1000))) return "Yesterday";
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    dayHeadingFmt.formatToParts(new Date(iso)).find((p) => p.type === type)?.value;
  const label = `${part("weekday")} ${part("day")} ${part("month")}`;
  return key.slice(0, 4) === dayKeyFmt.format(now).slice(0, 4) ? label : `${label} ${key.slice(0, 4)}`;
}

/** The UTC instant of the start of "today" in IST wall-clock time — for scoping the admin dashboard to today's orders only. */
export function startOfTodayIST(now: Date = new Date()): Date {
  const [year, month, day] = dayKeyFmt.format(now).split("-").map(Number);
  // IST is a fixed UTC+5:30 offset (no DST) — see slotEndTime() above.
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - (5 * 60 + 30) * 60_000);
}

const monthYearFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: IST,
  month: "long",
  year: "numeric",
});

/** "January 2026" — for the profile's "Member since" line. */
export function formatMonthYear(iso: string): string {
  return monthYearFmt.format(new Date(iso));
}

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

/**
 * IST wall-clock time-of-day bucket for the Home greeting — separate from
 * the delivery-slot windows above, which are about order ETAs, not mood.
 */
export function getTimeOfDayIST(now: Date = new Date()): TimeOfDay {
  const [h] = hourMinuteFmt.format(now).split(":").map(Number);
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}
