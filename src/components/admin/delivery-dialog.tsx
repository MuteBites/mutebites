"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { setDeliveryInfo, type DeliveryInput } from "@/lib/admin/delivery-actions";
import { formatTime } from "@/lib/date";
import { MAX_DELIVERY_NOTE, WITHIN_CHOICES, isSetToday, type DeliveryInfo, type DeliveryMode } from "@/lib/delivery";
import { formatLocalMobile } from "@/lib/phone";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

const istHHMM = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false });

/** "19:30" (IST) for an instant. */
function toHHMM(d: Date) {
  return istHHMM.format(d);
}

/** The next eight half-hours from now (IST), as "HH:MM" — the quick time chips. */
function nextHalfHours(now: Date): string[] {
  const step = 30 * 60_000;
  const first = Math.ceil((now.getTime() + 10 * 60_000) / step) * step;
  return Array.from({ length: 8 }, (_, i) => toHHMM(new Date(first + i * step)));
}

/** "19:30" → "7:30 PM". */
function label(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

const chip =
  "flex h-10 shrink-0 items-center justify-center rounded-full border px-3.5 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/80";
const chipOn = "surface-ink border-transparent bg-ink text-ink-foreground";

/**
 * Set when one or more restaurants will deliver today: an exact time
 * (quick half-hour chips, or any time from the picker) or "within N
 * minutes", plus an optional message and the delivery person's phone —
 * what students then see on their ticket. Opened from the Delivery tab, and
 * before turning a restaurant on (no time = no orders, by decision).
 */
export function DeliveryDialog({
  open,
  onOpenChange,
  restaurants,
  current,
  allOn,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The restaurant(s) being set. */
  restaurants: { id: string; name: string }[];
  /** What's set now (prefills the form when it's from today). */
  current?: DeliveryInfo | null;
  /** Every restaurant that's on — offers "Same for all N restaurants". */
  allOn?: { id: string; name: string }[];
  onSaved?: () => void;
}) {
  const today = isSetToday(current) ? current : null;
  const [mode, setMode] = useState<DeliveryMode>(today?.mode ?? "at");
  const [time, setTime] = useState(today && today.mode === "at" ? toHHMM(new Date(today.deliverAt)) : "");
  const [minutes, setMinutes] = useState<number>(today?.withinMinutes ?? 15);
  const [note, setNote] = useState(today?.note ?? "");
  const [phone, setPhone] = useState(today?.riderPhone ? formatLocalMobile(today.riderPhone.replace(/^\+91/, "")) : "");
  const [forAll, setForAll] = useState(false);
  const [pending, startTransition] = useTransition();
  const [chips] = useState(() => nextHalfHours(new Date()));

  const targets = forAll && allOn?.length ? allOn : restaurants;
  const title = restaurants.length === 1 ? `When will ${restaurants[0].name} deliver?` : "When will these deliver?";

  function save() {
    const input: DeliveryInput = { mode, note, riderPhone: phone, ...(mode === "at" ? { time } : { minutes }) };
    if (mode === "at" && !time) {
      toast.error("Pick a delivery time.");
      return;
    }
    startTransition(async () => {
      const result = await setDeliveryInfo(
        targets.map((r) => r.id),
        input,
      );
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `Delivery time set for ${targets.length === 1 ? targets[0].name : `${targets.length} restaurants`}.${
          result.notified ? ` ${result.notified} ${result.notified === 1 ? "student" : "students"} notified.` : ""
        }`,
      );
      onOpenChange(false);
      onSaved?.();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (pending ? null : onOpenChange(next))}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="mt-1">
          Students see this on their order. It only counts for today.
          {today && ` Now: ${today.mode === "within" ? `within ${today.withinMinutes} min (set ${formatTime(today.updatedAt)})` : formatTime(today.deliverAt)}.`}
        </DialogDescription>

        <div role="radiogroup" aria-label="How" className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-secondary p-1">
          {(["at", "within"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "h-10 rounded-full text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/80",
                mode === m ? "surface-slider glow-slider bg-slider text-slider-foreground" : "text-muted-foreground",
              )}
            >
              {m === "at" ? "At a time" : "Within minutes"}
            </button>
          ))}
        </div>

        {mode === "at" ? (
          <div className="mt-4">
            <p className="text-label text-muted-foreground">Delivered at Main Gate by</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {chips.map((c) => (
                <button key={c} type="button" onClick={() => setTime(c)} className={cn(chip, time === c ? chipOn : "bg-card")}>
                  {label(c)}
                </button>
              ))}
            </div>
            <label className="mt-3 flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">Other time</span>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-11 rounded-full border border-input bg-card px-4 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
              />
            </label>
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-label text-muted-foreground">Delivered within (from now)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {WITHIN_CHOICES.map((m) => (
                <button key={m} type="button" onClick={() => setMinutes(m)} className={cn(chip, minutes === m ? chipOn : "bg-card")}>
                  {m} min
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="mt-5 block">
          <span className="text-label text-muted-foreground">Message for students (optional)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, MAX_DELIVERY_NOTE))}
            rows={2}
            placeholder="e.g. Evening batch — collect at Main Gate"
            className="mt-1.5 w-full resize-none rounded-2xl border border-input bg-card px-4 py-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
          />
          <span className="block text-right text-xs text-muted-foreground tabular-nums">
            {note.length}/{MAX_DELIVERY_NOTE}
          </span>
        </label>

        <label className="mt-2 block">
          <span className="text-label text-muted-foreground">Delivery person&apos;s phone (optional)</span>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="off"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="98765 43210"
            className="mt-1.5 h-12 w-full rounded-full border border-input bg-card px-4 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
          />
        </label>

        {allOn && allOn.length > 1 && (
          <label className="mt-4 flex items-center gap-3 text-sm font-semibold">
            <input type="checkbox" checked={forAll} onChange={(e) => setForAll(e.target.checked)} className="size-5 accent-[var(--primary)]" />
            Same for all {allOn.length} restaurants that are on
          </label>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => onOpenChange(false)}
            className="h-12 rounded-full border bg-card text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={save}
            className="surface-primary glow-amber flex h-12 items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/80 disabled:opacity-70"
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            Save
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
