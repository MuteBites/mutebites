"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgePercent, Gift } from "lucide-react";
import { IconTile } from "@/components/icon-tile";
import { setOfferEnabled, setOfferRestaurant } from "@/lib/admin/actions";
import { isPercentOfferKey, OFFER_KEYS, OFFERS, type OfferKey, type PercentOfferKey } from "@/lib/offers";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

type Restaurant = { id: string; name: string };

/**
 * The /admin/offers list: one switch per discount (app_settings.offer_*).
 * Any mix can be on; students pick one per order in the cart. 10% / 20%
 * also list every restaurant with its own switch (all on unless switched
 * off — offer_restaurant_exclusions); the biryani offer is for one
 * restaurant (`restaurantName`). Ported from College Bites.
 */
export function OffersCard({
  active,
  restaurantName,
  restaurants,
  excluded,
}: {
  active: OfferKey[];
  restaurantName: string;
  restaurants: Restaurant[];
  excluded: Record<PercentOfferKey, string[]>;
}) {
  const router = useRouter();
  const [on, setOn] = useState(() => new Set(active));
  const [off, setOff] = useState(() => toKeys(excluded));
  // Resync when the server re-fetch changes it (another admin, another tab).
  const sync = `${active.join()}|${[...toKeys(excluded)].join()}`;
  const [prevSync, setPrevSync] = useState(sync);
  if (sync !== prevSync) {
    setPrevSync(sync);
    setOn(new Set(active));
    setOff(toKeys(excluded));
  }
  const [pending, setPending] = useState<Set<string>>(() => new Set());
  const [, startTransition] = useTransition();

  const detail: Record<OfferKey, string> = {
    pct10: "Off the whole order, at the restaurants switched on below",
    pct20: "Off the whole order, at the restaurants switched on below",
    biryani: `${restaurantName} only. Students pick which single biryani(s) they get free`,
  };

  function flip<T>(set: Set<T>, value: T, add: boolean) {
    const copy = new Set(set);
    if (add) copy.add(value);
    else copy.delete(value);
    return copy;
  }

  function run(id: string, action: () => Promise<{ ok: true } | { ok: false; error: string }>, undo: () => void, done: string) {
    setPending((p) => flip(p, id, true));
    startTransition(async () => {
      const result = await action();
      setPending((p) => flip(p, id, false));
      if (result.ok) {
        toast.success(done);
        router.refresh();
      } else {
        undo();
        toast.error(result.error);
      }
    });
  }

  function toggleOffer(key: OfferKey) {
    const next = !on.has(key);
    setOn((s) => flip(s, key, next));
    run(
      key,
      () => setOfferEnabled(key, next),
      () => setOn((s) => flip(s, key, !next)),
      `${OFFERS[key].title} is ${next ? "on" : "off"}.`,
    );
  }

  function toggleRestaurant(key: PercentOfferKey, r: Restaurant) {
    const id = `${key}:${r.id}`;
    const next = off.has(id); // currently off → switch on
    setOff((s) => flip(s, id, !next));
    run(
      id,
      () => setOfferRestaurant(key, r.id, next),
      () => setOff((s) => flip(s, id, next)),
      `${OFFERS[key].title} is ${next ? "on" : "off"} at ${r.name}.`,
    );
  }

  return (
    <ul className="divide-y overflow-hidden rounded-[1.5rem] border bg-card shadow-card">
      {OFFER_KEYS.map((key) => {
        const enabled = on.has(key);
        const onCount = restaurants.filter((r) => !off.has(`${key}:${r.id}`)).length;
        return (
          <li key={key} className="px-5 py-4">
            <div className="flex items-center gap-3.5">
              <IconTile>
                {key === "biryani" ? (
                  <Gift className="size-5" aria-hidden="true" />
                ) : (
                  <BadgePercent className="size-5" aria-hidden="true" />
                )}
              </IconTile>
              <div className="min-w-0 flex-1">
                <p id={`offer-${key}`} className="font-semibold">
                  {OFFERS[key].title}
                </p>
                <p className="text-sm text-muted-foreground">{detail[key]}</p>
              </div>
              <Switch
                checked={enabled}
                labelledBy={`offer-${key}`}
                disabled={pending.has(key)}
                onClick={() => toggleOffer(key)}
              />
            </div>

            {isPercentOfferKey(key) && restaurants.length > 0 && (
              <div className="mt-3 rounded-2xl bg-background px-4 py-2">
                <p className="pt-1 text-label text-muted-foreground">
                  Restaurants · {onCount} of {restaurants.length} on
                  {!enabled && " (applies once the offer is on)"}
                </p>
                <ul className="divide-y divide-border">
                  {restaurants.map((r) => {
                    const id = `${key}:${r.id}`;
                    const labelId = `offer-${id}`;
                    return (
                      <li key={r.id} className="flex items-center gap-3 py-2.5">
                        <span id={labelId} className="min-w-0 flex-1 text-sm font-medium">
                          <span className="sr-only">{OFFERS[key].title} at </span>
                          {r.name}
                        </span>
                        <Switch
                          small
                          checked={!off.has(id)}
                          labelledBy={labelId}
                          disabled={pending.has(id)}
                          onClick={() => toggleRestaurant(key, r)}
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function toKeys(excluded: Record<PercentOfferKey, string[]>): Set<string> {
  return new Set(
    (Object.keys(excluded) as PercentOfferKey[]).flatMap((k) => excluded[k].map((id) => `${k}:${id}`)),
  );
}

function Switch({
  checked,
  labelledBy,
  disabled,
  onClick,
  small = false,
}: {
  checked: boolean;
  labelledBy: string;
  disabled: boolean;
  onClick: () => void;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/80 disabled:opacity-60",
        small ? "h-6 w-11" : "h-8 w-14",
        checked ? "surface-primary glow-amber bg-primary" : "bg-secondary",
      )}
    >
      <span
        className={cn(
          "rounded-full bg-white shadow transition-transform",
          small ? "size-4.5" : "size-6",
          checked ? (small ? "translate-x-5.5" : "translate-x-7") : small ? "translate-x-0.75" : "translate-x-1",
        )}
      />
    </button>
  );
}
