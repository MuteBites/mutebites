import { BadgeCheck, CheckCheck, Power, ShoppingBag, Store } from "lucide-react";
import { cn } from "@/lib/utils";

function StatCard({
  icon,
  iconClassName,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconClassName: string;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card shadow-card p-4">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl [&>svg]:size-4.5",
          iconClassName,
        )}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-label text-muted-foreground">
          {label}
        </p>
        <p className="font-heading text-xl font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export function StatCards({
  totalOrders,
  confirmedOrders,
  completedOrders,
  activeRestaurants,
  totalRestaurants,
  orderingEnabled,
}: {
  totalOrders: number;
  confirmedOrders: number;
  completedOrders: number;
  activeRestaurants: number;
  totalRestaurants: number;
  orderingEnabled: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <StatCard
        icon={<ShoppingBag />}
        iconClassName="bg-brand-soft text-brand-soft-foreground"
        label="Today's orders"
        value={totalOrders}
      />
      <StatCard
        icon={<BadgeCheck />}
        iconClassName="bg-brand-soft text-brand-soft-foreground"
        label="Confirmed"
        value={confirmedOrders}
      />
      <StatCard
        icon={<CheckCheck />}
        iconClassName="bg-success-soft text-success"
        label="Completed"
        value={completedOrders}
      />
      <StatCard
        icon={<Store />}
        iconClassName="bg-secondary text-secondary-foreground"
        label="Active vendors"
        value={
          <>
            {activeRestaurants}
            <span className="text-muted-foreground">/{totalRestaurants}</span>
          </>
        }
      />
      <StatCard
        icon={<Power />}
        iconClassName={orderingEnabled ? "bg-success-soft text-success" : "bg-destructive/10 text-destructive"}
        label="System state"
        value={
          <span className="inline-flex items-center gap-1.5">
            <span
              className={cn(
                "size-2 rounded-full",
                orderingEnabled ? "bg-success" : "bg-destructive",
              )}
              aria-hidden="true"
            />
            {orderingEnabled ? "Live" : "Paused"}
          </span>
        }
      />
    </div>
  );
}
