"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Gift } from "lucide-react";
import { IconTile } from "@/components/icon-tile";
import { Switch } from "@/components/admin/offers-card";
import { setDealEnabled } from "@/lib/admin/actions";
import { DEALS, type DealKey } from "@/lib/deals";
import { toast } from "@/lib/toast/store";

/**
 * Restaurant deals on /admin/offers: one switch per deal, grouped by
 * restaurant (public.deal_switches). On = the cart applies it on its own
 * when the order qualifies; place_order() is the real rule.
 */
export function DealsCard({ on: initial }: { on: DealKey[] }) {
  const router = useRouter();
  const [on, setOn] = useState(() => new Set(initial));
  const sync = initial.join();
  const [prev, setPrev] = useState(sync);
  if (sync !== prev) {
    setPrev(sync);
    setOn(new Set(initial));
  }
  const [pending, setPending] = useState<DealKey | null>(null);
  const [, startTransition] = useTransition();

  function toggle(key: DealKey) {
    const next = !on.has(key);
    const set = (v: boolean) =>
      setOn((s) => {
        const c = new Set(s);
        if (v) c.add(key);
        else c.delete(key);
        return c;
      });
    set(next);
    setPending(key);
    startTransition(async () => {
      const res = await setDealEnabled(key, next);
      setPending(null);
      if (!res.ok) {
        set(!next);
        toast.error(res.error);
        return;
      }
      toast.success(`Offer ${next ? "on" : "off"}`);
      router.refresh();
    });
  }

  const restaurants = [...new Set(DEALS.map((d) => d.restaurant))];
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-heading text-title font-bold">Restaurant deals</h2>
        <p className="text-sm text-muted-foreground">
          Applied on their own in the cart when the order qualifies — the biggest one reached per
          group, once per order. They work alongside the discount the student picks.
        </p>
      </div>
      {restaurants.map((r) => (
        <ul key={r} className="divide-y overflow-hidden rounded-[1.5rem] border bg-card shadow-card">
          <li className="flex items-center gap-3.5 bg-secondary/40 px-5 py-3">
            <IconTile>
              <Gift className="size-5" aria-hidden="true" />
            </IconTile>
            <p className="font-semibold">{r}</p>
          </li>
          {DEALS.filter((d) => d.restaurant === r)
            .slice()
            .sort((a, b) => a.group.localeCompare(b.group) || a.min - b.min)
            .map((d) => (
              <li key={d.key} className="flex items-center gap-3 px-5 py-3.5">
                <p id={`deal-${d.key}`} className="min-w-0 flex-1 text-sm font-medium">
                  {d.title}
                </p>
                <Switch
                  checked={on.has(d.key)}
                  labelledBy={`deal-${d.key}`}
                  disabled={pending === d.key}
                  onClick={() => toggle(d.key)}
                />
              </li>
            ))}
        </ul>
      ))}
    </section>
  );
}
