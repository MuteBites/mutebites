import type { Metadata } from "next";
import { TabBar } from "@/components/nav/tab-bar";
import { CravingsSolved } from "@/components/profile/cravings-solved";
import { getUnlockedMilestones, MilestoneBadges } from "@/components/profile/milestone-badges";
import { MilestoneUnlockWatcher } from "@/components/profile/milestone-unlock-watcher";
import { PickupStats } from "@/components/profile/pickup-stats";
import { SoundToggle } from "@/components/profile/sound-toggle";
import { ThemeIconToggle } from "@/components/theme/theme-icon-toggle";
import { ThemeSegmented } from "@/components/theme/theme-segmented";
import { getOrderStats, hasActiveOrder } from "@/lib/data/orders";
import { getRestaurantCount } from "@/lib/data/restaurants";
import { formatMonthYear } from "@/lib/date";
import { requireProfile } from "@/lib/profile";
import { EditableName } from "./editable-name";
import { EditablePhone } from "./editable-phone";
import { ACTIVE_ORDER_PHONE_LOCK_MESSAGE, BANNED_PHONE_LOCK_MESSAGE } from "./phone-lock";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = { title: "Profile · MuteBites" };

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts.at(-1)![0] : "")).toUpperCase();
}

export default async function ProfilePage() {
  const profile = await requireProfile();
  const [orderInProgress, orderStats, totalRestaurants] = await Promise.all([
    hasActiveOrder(profile.id),
    getOrderStats(profile.id),
    getRestaurantCount(),
  ]);

  // Mirrors the precedence in profile/actions.ts's updatePhone — that
  // server check is the real enforcement; this just tells the UI which
  // message (if any) to show instead of the Edit button.
  const phoneLockReason = profile.is_banned
    ? BANNED_PHONE_LOCK_MESSAGE
    : orderInProgress
      ? ACTIVE_ORDER_PHONE_LOCK_MESSAGE
      : null;

  const unlockedMilestones = getUnlockedMilestones(
    orderStats.deliveredCount,
    orderStats.restaurantsVisited,
    totalRestaurants,
  );

  return (
    <main className="mx-auto w-full max-w-md px-6 pt-6 pb-28">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary font-heading text-xl font-bold text-primary-foreground">
            {initials(profile.full_name)}
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-heading text-2xl font-bold">{profile.full_name}</h1>
            <CravingsSolved count={orderStats.deliveredCount} streakDays={orderStats.streakDays} />
          </div>
        </div>
        <ThemeIconToggle />
      </div>

      <MilestoneBadges
        deliveredCount={orderStats.deliveredCount}
        restaurantsVisited={orderStats.restaurantsVisited}
        totalRestaurants={totalRestaurants}
      />
      <MilestoneUnlockWatcher unlockedCsv={unlockedMilestones.join(",")} />
      {(orderStats.deliveredCount > 0 || orderStats.cancelledCount > 0) && (
        <PickupStats pickups={orderStats.deliveredCount} noShows={orderStats.cancelledCount} />
      )}

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
        <div className="flex items-center justify-between px-5 py-4">
          <p className="font-mono text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
            Member since
          </p>
          <p className="font-semibold">{formatMonthYear(profile.created_at)}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="font-semibold text-muted-foreground">Appearance</p>
        <ThemeSegmented />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="font-semibold text-muted-foreground">Order placed sound</p>
        <SoundToggle />
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

      <div className="mt-6 border-t pt-4">
        <SignOutButton />
      </div>

      <TabBar />
    </main>
  );
}
