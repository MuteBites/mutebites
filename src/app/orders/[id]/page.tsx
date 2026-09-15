import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Phone } from "lucide-react";
import { getOrder } from "@/lib/data/orders";
import { estimatedDelivery, formatTime } from "@/lib/date";
import { formatRupees } from "@/lib/format";
import { orderReference, orderTimeline, type TimelineStepState } from "@/lib/orders/status";
import { requireProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/orders/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: `Order ${orderReference(id)} · MuteBites` };
}

export default async function OrderDetailPage({ params }: PageProps<"/orders/[id]">) {
  const profile = await requireProfile();
  const { id } = await params;
  const order = await getOrder(id, profile.id);
  if (!order) notFound();

  const cancelled = order.status === "cancelled";
  const steps = cancelled ? [] : orderTimeline(order.status);

  return (
    <main className="mx-auto w-full max-w-md px-6 pb-12">
      <div className="flex items-center gap-3 pt-4 pb-2">
        <Link
          href="/orders"
          aria-label="Back to your orders"
          className="flex size-11 items-center justify-center rounded-full bg-secondary outline-none hover:bg-border focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <ArrowLeft className="size-5" />
        </Link>
      </div>

      <div className="rounded-3xl bg-ink p-6 text-ink-foreground">
        <p className="text-sm opacity-70">Order placed · {formatTime(order.createdAt)}</p>
        {!cancelled && (
          <div className="mt-4 flex items-start justify-between gap-2">
            <p className="font-mono text-xs font-semibold tracking-[0.1em] text-primary uppercase">
              Show this token
            </p>
            <p className="max-w-[9rem] shrink-0 text-right text-sm font-bold text-ink-foreground/90">
              {estimatedDelivery(order.createdAt)}
            </p>
          </div>
        )}
        <p className={cn("font-heading text-4xl font-bold tracking-tight", cancelled ? "mt-4" : "mt-1")}>
          {orderReference(order.id)}
        </p>
        <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm">
          <span aria-hidden="true">📍</span> Collect at VIT-AP Main Gate
        </p>
      </div>

      {cancelled ? (
        <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4">
          <p className="font-heading text-lg font-bold text-destructive">Order cancelled</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This order won&apos;t be delivered. If you were charged or have questions, call
            MuteBites.
          </p>
        </div>
      ) : (
        <ol className="mt-6 flex flex-col">
          {steps.map((step, i) => (
            <li key={step.label} className="flex gap-4">
              <div className="flex flex-col items-center">
                <StepDot state={step.state} />
                {i < steps.length - 1 && (
                  <span
                    className={cn("w-0.5 flex-1", step.state === "done" ? "bg-success" : "bg-border")}
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className={cn("pb-6", step.state === "upcoming" && "opacity-50")}>
                <p className={cn("font-semibold", step.state === "current" && "text-primary")}>{step.label}</p>
                {i === 0 && <p className="text-sm text-muted-foreground">{formatTime(order.createdAt)}</p>}
                {step.state === "current" && step.label.startsWith("Preparing") && (
                  <p className="text-sm text-muted-foreground">We&apos;ll call you when we reach the gate.</p>
                )}
                {i === steps.length - 1 && step.state === "done" && (
                  <p className="text-sm text-muted-foreground">{formatTime(order.updatedAt)}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-2 rounded-2xl border bg-card p-5">
        <p className="font-mono text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          {order.restaurantName}
        </p>
        <ul className="mt-3 divide-y">
          {order.items.map((item) => (
            <li key={item.dishName} className="flex justify-between py-2 text-sm">
              <span>
                {item.quantity} × {item.dishName}
              </span>
              <span className="tabular-nums">{formatRupees(item.subtotal)}</span>
            </li>
          ))}
        </ul>
        {order.notes && (
          <p className="mt-3 rounded-xl bg-secondary px-4 py-2.5 text-sm text-muted-foreground">
            “{order.notes}”
          </p>
        )}
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <p className="font-semibold">Pay in cash</p>
          <p className="font-heading text-xl font-bold tabular-nums">{formatRupees(order.totalAmount)}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl border bg-card px-5 py-4">
        <div>
          <p className="text-sm text-muted-foreground">Something wrong?</p>
          <p className="font-semibold">Call MuteBites</p>
        </div>
        <a
          href={`tel:${order.restaurantPhone}`}
          className="flex h-11 items-center gap-2 rounded-xl bg-ink px-4 font-semibold text-ink-foreground outline-none hover:bg-ink/90 focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <Phone className="size-4" /> Call
        </a>
      </div>
    </main>
  );
}

function StepDot({ state }: { state: TimelineStepState }) {
  if (state === "done") {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success text-white">
        <Check className="size-4" />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary ring-4 ring-primary/20"
        aria-hidden="true"
      />
    );
  }
  return <span className="size-7 shrink-0 rounded-full border-2 border-border" aria-hidden="true" />;
}
