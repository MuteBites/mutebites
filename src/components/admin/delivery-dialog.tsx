"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { addBatch, updateBatch, type BatchInput } from "@/lib/admin/delivery-actions";
import { MAX_DELIVERY_NOTE, type Batch } from "@/lib/delivery";
import { formatLocalMobile } from "@/lib/phone";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

const istHHMM = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false });

/** "19:30" (IST) for an instant. */
function toHHMM(d: Date) {
  return istHHMM.format(d);
}

/** "19:30" → minutes since midnight. */
function minutesOf(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Minutes since midnight → "19:30". */
function hhmmOf(minutes: number) {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** "19:30" → "7:30 PM". */
function label(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** The next eight half-hours from now (IST) — the cut-off chips. */
function nextHalfHours(now: Date): string[] {
  const step = 30 * 60_000;
  const first = Math.ceil((now.getTime() + 5 * 60_000) / step) * step;
  return Array.from({ length: 8 }, (_, i) => toHHMM(new Date(first + i * step)));
}

const chip =
  "flex h-10 shrink-0 items-center justify-center rounded-full border px-3.5 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/80";
const chipOn = "surface-ink border-transparent bg-ink text-ink-foreground";
const timeInput =
  "h-11 rounded-full border border-input bg-card px-4 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/80";

/**
 * Add or edit a delivery batch: orders until HH:MM (half-hour chips or any
 * time) → delivered by HH:MM (chips 20 / 30 / 40 / 60 min after the
 * cut-off, or any time), plus an optional message and the delivery
 * person's phone — what students see on their ticket. Adding can go to
 * every restaurant that's on at once. Opened from the Delivery tab, and
 * before turning a restaurant on after 12:45 PM (no batch = no orders).
 */
export function DeliveryDialog({
  open,
  onOpenChange,
  restaurants,
  batch,
  allOn,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Who the new batch is for (ignored when editing). */
  restaurants: { id: string; name: string }[];
  /** Editing this batch; omitted = a new one. */
  batch?: Batch | null;
  /** Every restaurant that's on — offers "Same for all N". */
  allOn?: { id: string; name: string }[];
  onSaved?: () => void;
}) {
  const [chips] = useState(() => nextHalfHours(new Date()));
  const [until, setUntil] = useState(batch ? toHHMM(new Date(batch.orderUntil)) : "");
  const [at, setAt] = useState(batch ? toHHMM(new Date(batch.deliverAt)) : "");
  const [note, setNote] = useState(batch?.note ?? "");
  const [phone, setPhone] = useState(batch?.riderPhone ? formatLocalMobile(batch.riderPhone.replace(/^\+91/, "")) : "");
  const [forAll, setForAll] = useState(false);
  const [pending, startTransition] = useTransition();

  const targets = forAll && allOn?.length ? allOn : restaurants;
  const name = restaurants.length === 1 ? restaurants[0].name : `${restaurants.length} restaurants`;
  const afterChips = until ? [20, 30, 40, 60].map((m) => hhmmOf(minutesOf(until) + m)) : [];

  function save() {
    if (!until || !at) {
      toast.error(!until ? "Pick until when orders join this batch." : "Pick when it'll be delivered.");
      return;
    }
    const input: BatchInput = { orderUntil: until, deliverAt: at, note, riderPhone: phone };
    startTransition(async () => {
      const result = batch ? await updateBatch(batch.id, input) : await addBatch(targets.map((r) => r.id), input);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `${batch ? "Batch saved" : `Batch added for ${targets.length === 1 ? targets[0].name : `${targets.length} restaurants`}`}.${
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
        <DialogTitle>{batch ? "Edit batch" : `New batch · ${name}`}</DialogTitle>
        <DialogDescription className="mt-1">
          Orders placed until the cut-off join this batch, and students see its delivery time. Today only.
        </DialogDescription>

        <div className="mt-4">
          <p className="text-label text-muted-foreground">Orders until</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {chips.map((c) => (
              <button key={c} type="button" onClick={() => setUntil(c)} className={cn(chip, until === c ? chipOn : "bg-card")}>
                {label(c)}
              </button>
            ))}
          </div>
          <label className="mt-2 flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">Other time</span>
            <input type="time" value={until} onChange={(e) => setUntil(e.target.value)} className={timeInput} />
          </label>
        </div>

        <div className="mt-5">
          <p className="text-label text-muted-foreground">Delivered at Main Gate by</p>
          {afterChips.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {afterChips.map((c, i) => (
                <button key={c} type="button" onClick={() => setAt(c)} className={cn(chip, at === c ? chipOn : "bg-card")}>
                  {label(c)}
                  <span className="ml-1 text-xs opacity-75">+{[20, 30, 40, 60][i]}</span>
                </button>
              ))}
            </div>
          )}
          <label className="mt-2 flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">Other time</span>
            <input type="time" value={at} onChange={(e) => setAt(e.target.value)} className={timeInput} />
          </label>
        </div>

        <label className="mt-5 block">
          <span className="text-label text-muted-foreground">Message for students (optional)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, MAX_DELIVERY_NOTE))}
            rows={2}
            placeholder="e.g. Second batch — collect at Main Gate"
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

        {!batch && allOn && allOn.length > 1 && (
          <label className="mt-4 flex items-center gap-3 text-sm font-semibold">
            <input type="checkbox" checked={forAll} onChange={(e) => setForAll(e.target.checked)} className="size-5 accent-[var(--primary)]" />
            Same batch for all {allOn.length} restaurants that are on
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
