import type { Metadata } from "next";
import { BadgeCheck, Clock, ShieldAlert } from "lucide-react";
import { formatRupees } from "@/lib/format";
import { verifyPartnerOrder } from "@/lib/partners/sign";
import { formatStoredMobile } from "@/lib/phone";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Verify order · MuteBites",
  robots: { index: false, follow: false },
};

const timeFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

/**
 * The verify link at the end of every Spice Magic WhatsApp order (the
 * MuteBites x FoodHub collab). Public, so FoodHub can open it without
 * signing in. The token carries the order, signed by MuteBites
 * (src/lib/partners/sign.ts): shown as sent when it checks out, a red
 * "not a real MuteBites order" when the link was made up or changed.
 * Nothing is looked up; nothing is stored.
 */
export default async function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = verifyPartnerOrder(decodeURIComponent(token));

  return (
    <main className="foodhub min-h-dvh px-5 pt-10 pb-16">
      <div className="mx-auto w-full max-w-md">
        <h1 className="sr-only">Verify a MuteBites order</h1>
        {result.status === "invalid" ? (
          <section className="rounded-[1.75rem] border border-destructive/40 bg-card p-6 text-center shadow-card">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
              <ShieldAlert className="size-8" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-heading text-headline font-bold text-destructive">Not a real MuteBites order</h2>
            <p className="mt-2 text-muted-foreground">
              This link wasn&apos;t made by MuteBites, or someone changed it. Don&apos;t cook from this message.
            </p>
          </section>
        ) : (
          <section className="overflow-hidden rounded-[1.75rem] bg-card shadow-raised">
            <div className="collab-wash relative px-6 pt-6 pb-5">
              <span className="collab-sweep" aria-hidden="true" />
              <p
                className={cn(
                  "relative inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold",
                  result.status === "valid" ? "bg-hero-success text-hero" : "bg-hero-danger text-hero",
                )}
              >
                {result.status === "valid" ? (
                  <BadgeCheck className="size-4" aria-hidden="true" />
                ) : (
                  <Clock className="size-4" aria-hidden="true" />
                )}
                {result.status === "valid" ? "Verified MuteBites order" : "Real, but over 24 hours old"}
              </p>
              <h2 className="relative mt-3 font-heading text-headline font-bold">{result.order.r}</h2>
              <p className="relative text-sm text-hero-foreground/85">Sent {timeFmt.format(result.order.s)}</p>
            </div>
            <ul className="divide-y px-6">
              {result.order.i.map(([name, qty, price]) => (
                <li key={name} className="flex items-baseline justify-between gap-3 py-3">
                  <span>
                    {name} <span className="text-muted-foreground">- {qty}</span>
                  </span>
                  <span className="tabular-nums">{formatRupees(qty * price)}</span>
                </li>
              ))}
            </ul>
            <div className="mx-6 flex items-baseline justify-between border-t-2 border-dashed py-3 font-semibold">
              <span>Total</span>
              <span className="font-heading text-2xl font-bold text-primary tabular-nums">{formatRupees(result.order.t)}</span>
            </div>
            <dl className="space-y-1 bg-secondary px-6 py-4 text-sm">
              {result.order.o && (
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">Note</dt>
                  <dd>{result.order.o}</dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-semibold">{result.order.n}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="font-semibold">{formatStoredMobile(result.order.p)}</dd>
              </div>
            </dl>
            <p className="px-6 py-4 text-sm text-muted-foreground">
              If the WhatsApp message says anything different, go by this page. Pay on delivery.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
