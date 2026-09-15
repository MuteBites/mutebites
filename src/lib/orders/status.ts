import type { OrderStatus } from "@/lib/data/types";

/**
 * Short display reference from an order's uuid (e.g. "#4F2A"). Cosmetic
 * only — not stored, not guaranteed unique, never used to look up an
 * order (routes use the full id for that).
 */
export function orderReference(id: string): string {
  return `#${id.replace(/-/g, "").slice(-4).toUpperCase()}`;
}

export const ACTIVE_STATUSES: OrderStatus[] = ["pending", "confirmed", "preparing", "out_for_delivery"];

/** True while the order is still on its way (not delivered or cancelled). */
export function isActiveStatus(status: OrderStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

export function statusBadge(status: OrderStatus): { label: string; className: string } {
  switch (status) {
    case "pending":
      return { label: "PLACED", className: "bg-brand-soft text-brand-soft-foreground" };
    case "confirmed":
      return { label: "CONFIRMED", className: "bg-brand-soft text-brand-soft-foreground" };
    case "preparing":
      return { label: "PREPARING", className: "bg-brand-soft text-brand-soft-foreground" };
    case "out_for_delivery":
      return { label: "OUT FOR DELIVERY", className: "bg-brand-soft text-brand-soft-foreground" };
    case "delivered":
      return { label: "DELIVERED", className: "bg-success-soft text-success" };
    case "cancelled":
      return { label: "CANCELLED", className: "bg-destructive/10 text-destructive" };
  }
}

export type TimelineStepState = "done" | "current" | "upcoming";
export type TimelineStep = { label: string; state: TimelineStepState };

/**
 * The 3-row student-facing timeline. Collapses preparing/out_for_delivery
 * into one row — we don't have a per-status timestamp to show a 4th step
 * meaningfully. Callers handle 'cancelled' separately (no timeline for it).
 */
export function orderTimeline(status: OrderStatus): TimelineStep[] {
  let confirmed: TimelineStepState;
  let preparing: TimelineStepState;

  switch (status) {
    case "pending":
      confirmed = "current";
      preparing = "upcoming";
      break;
    case "confirmed":
      confirmed = "done";
      preparing = "current";
      break;
    case "preparing":
    case "out_for_delivery":
      confirmed = "done";
      preparing = "current";
      break;
    case "delivered":
      confirmed = "done";
      preparing = "done";
      break;
    default:
      // 'cancelled' has no timeline — callers branch on it before calling this.
      confirmed = "upcoming";
      preparing = "upcoming";
  }

  return [
    { label: "Order placed", state: "done" },
    { label: "Restaurant confirmed", state: confirmed },
    { label: "Preparing & out for delivery", state: preparing },
  ];
}
