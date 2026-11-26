"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Gift } from "lucide-react";
import { IconTile } from "@/components/icon-tile";
import { Switch } from "@/components/admin/offers-card";
import { setDealEnabled } from "@/lib/admin/actions";
import { DEALS, type DealKey } from "@/lib/deals";
import { toast } from "@/lib/toast/store";

const RESTAURANTS = [...new Set(DEALS.map((d) => d.restaurant))];

/**
 * Restaurant deals on /admin/offers, above the discount switches: ONE switch
 * per restaurant (the client's call, 26 Nov 2026) that turns all of its
 * deals on or off together (public.deal_switches), with the deals listed
 * under it. On = the cart applies them on their own; place_order() is the
 * real rule.
 */
export function DealsCard({ on }: { on: DealKey[] }) {
  const router = useRouter();
  const isOn = (r: string) => DEALS.some((d) => d.restaurant === r && on.includes(d.key));
  const serverState = RESTAURANTS.map(isOn).join();
  const [state, setState] = useState(() => new Map(RESTAURANTS.map((r) => [r, isOn(r)])));
  const [prev, setPrev] = useState(serverState);
  if (serverState !== prev) {
    setPrev(serverState);
    setState(new Map(RESTAURANTS.map((r) => [r, isOn(r)])));
  }
  const [pending, setPending] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggle(r: string) {
    const next = !state.get(r);
    setState((m) => new Map(m).set(r, next));
    setPending(r);
    startTransition(async () => {
      const res = await setDealEnabled(r, next);
      setPending(null);
      if (!res.ok) {
        setState((m) => new Map(m).set(r, !next));
        toast.error(res.error);
        return;
      }
      toast.success(`${r} offers ${next ? "on" : "off"}`);
      router.refresh();
    });
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-heading text-title font-bold">Restaurant deals</h2>
        <p className="text-sm text-muted-foreground">
          One switch per restaurant. When it&apos;s on, its deals apply by themselves in the cart.
        </p>
      </div>
      <ul className="divide-y overflow-hidden rounded-[1.5rem] border bg-card shadow-card">
        {RESTAURANTS.map((r) => {
          const id = `deals-${r.replace(/\W+/g, "-")}`;
          return (
            <li key={r} className="px-5 py-4">
              <div className="flex items-center gap-3.5">
                <IconTile>
                  <Gift className="size-5" aria-hidden="true" />
                </IconTile>
                <p id={id} className="min-w-0 flex-1 font-semibold">
                  {r}
                </p>
                <Switch
                  checked={state.get(r) ?? false}
                  labelledBy={id}
                  disabled={pending === r}
                  onClick={() => toggle(r)}
                />
              </div>
              <ul className="mt-2.5 space-y-1 pl-[3.6rem] text-sm text-muted-foreground">
                {DEALS.filter((d) => d.restaurant === r)
                  .sort((a, b) => a.group.localeCompare(b.group) || a.min - b.min)
                  .map((d) => (
                    <li key={d.key}>· {d.title}</li>
                  ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
