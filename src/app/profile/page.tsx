import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions";
import { TabBar } from "@/components/nav/tab-bar";
import { ThemeIconToggle } from "@/components/theme/theme-icon-toggle";
import { ThemeSegmented } from "@/components/theme/theme-segmented";
import { getOrderCount, hasActiveOrder } from "@/lib/data/orders";
import { requireProfile } from "@/lib/profile";
import { EditableName } from "./editable-name";
import { EditablePhone } from "./editable-phone";
import { ACTIVE_ORDER_PHONE_LOCK_MESSAGE, BANNED_PHONE_LOCK_MESSAGE } from "./phone-lock";

export const metadata: Metadata = { title: "Profile · MuteBites" };

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts.at(-1)![0] : "")).toUpperCase();
}

export default async function ProfilePage() {
  const profile = await requireProfile();
  const [orderCount, orderInProgress] = await Promise.all([
    getOrderCount(profile.id),
    hasActiveOrder(profile.id),
  ]);

  // Mirrors the precedence in profile/actions.ts's updatePhone — that
  // server check is the real enforcement; this just tells the UI which
  // message (if any) to show instead of the Edit button.
  const phoneLockReason = profile.is_banned
    ? BANNED_PHONE_LOCK_MESSAGE
    : orderInProgress
      ? ACTIVE_ORDER_PHONE_LOCK_MESSAGE
      : null;

  return (
    <main className="mx-auto w-full max-w-md px-6 pt-6 pb-28">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary font-heading text-xl font-bold text-primary-foreground">
            {initials(profile.full_name)}
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-heading text-2xl font-bold">{profile.full_name}</h1>
            <p className="text-muted-foreground">
              {orderCount} {orderCount === 1 ? "order" : "orders"} placed
            </p>
          </div>
        </div>
        <ThemeIconToggle />
      </div>

      <p className="mt-6 font-mono text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        Tap any field to edit
      </p>

      <div className="mt-2 divide-y rounded-2xl border bg-card">
        <EditableName initialValue={profile.full_name} />
        <EditablePhone
          initialValue={profile.phone}
          lockedReason={phoneLockReason}
          banned={profile.is_banned}
        />
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="font-mono text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
              Email · signed in with Google
            </p>
            <p className="mt-0.5 truncate font-semibold">{profile.email}</p>
          </div>
          <span className="shrink-0 font-mono text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
            Locked
          </span>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="font-semibold text-muted-foreground">Appearance</p>
        <ThemeSegmented />
      </div>

      <p className="mt-6 flex items-center gap-3 rounded-2xl border border-primary/20 bg-brand-soft px-5 py-4">
        <span aria-hidden="true">📍</span>
        <span>
          <span className="block font-mono text-xs font-semibold tracking-[0.1em] text-brand-soft-foreground uppercase">
            Fixed handover point
          </span>
          <span className="font-semibold text-foreground">VIT-AP Main Gate</span>
        </span>
      </p>

      <form action={signOut} className="mt-6 border-t pt-4">
        <button
          type="submit"
          className="flex w-full items-center justify-between font-semibold text-destructive outline-none hover:underline focus-visible:ring-2 focus-visible:ring-destructive/30"
        >
          Sign out
          <LogOut className="size-4" />
        </button>
      </form>

      <TabBar />
    </main>
  );
}
