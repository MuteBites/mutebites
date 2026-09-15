/** Shown campus-wide when an admin flips the ordering kill switch off. */
export function OrderingPausedBanner() {
  return (
    <div className="mt-6 rounded-2xl bg-ink p-5 text-ink-foreground">
      <p className="flex items-center gap-2 font-heading text-lg font-bold">
        <span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
        Ordering is paused right now
      </p>
      <p className="mt-1.5 text-sm text-ink-foreground/70">
        We&apos;re not running deliveries at the moment. Menus stay open for browsing — try again in
        a bit.
      </p>
    </div>
  );
}
