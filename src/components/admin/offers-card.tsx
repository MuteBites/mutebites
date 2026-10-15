"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgePercent, Gift } from "lucide-react";
import { IconTile } from "@/components/icon-tile";
import { setOfferEnabled } from "@/lib/admin/actions";
import { OFFER_KEYS, OFFERS, type OfferKey } from "@/lib/offers";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

/**
 * The /admin/offers list: one switch per discount (app_settings.offer_*).
 * Any mix can be on; students pick one per order in the cart. Every offer
 * is for one restaurant (`restaurantName`). Ported from College Bites.
 */
export function OffersCard({ active, restaurantName }: { active: OfferKey[]; restaurantName: string }) {
  const router = useRouter();
  const [on, setOn] = useState(() => new Set(active));
  // Resync when the server re-fetch changes it (another admin, another tab).
  const [prevActive, setPrevActive] = useState(active.join());
  if (active.join() !== prevActive) {
    setPrevActive(active.join());
    setOn(new Set(active));
  }
  const [pendingKey, setPendingKey] = useState<OfferKey | null>(null);
  const [, startTransition] = useTransition();

  const detail: Record<OfferKey, string> = {
    pct10: `Off the whole ${restaurantName} order`,
    pct20: `Off the whole ${restaurantName} order`,
    biryani: `${restaurantName} only. Students pick which single biryani(s) they get free`,
  };

  function toggle(key: OfferKey) {
    const next = !on.has(key);
    setOn((s) => {
      const copy = new Set(s);
      if (next) copy.add(key);
      else copy.delete(key);
      return copy;
    });
    setPendingKey(key);
    startTransition(async () => {
      const result = await setOfferEnabled(key, next);
      setPendingKey(null);
      if (result.ok) {
        toast.success(`${OFFERS[key].title} is ${next ? "on" : "off"}.`);
        router.refresh();
      } else {
        setOn((s) => {
          const copy = new Set(s);
          if (next) copy.delete(key);
          else copy.add(key);
          return copy;
        });
        toast.error(result.error);
      }
    });
  }

  return (
    <ul className="divide-y overflow-hidden rounded-[1.5rem] border bg-card shadow-card">
      {OFFER_KEYS.map((key) => {
        const enabled = on.has(key);
        return (
          <li key={key} className="flex items-center gap-3.5 px-5 py-4">
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
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-labelledby={`offer-${key}`}
              disabled={pendingKey === key}
              onClick={() => toggle(key)}
              className={cn(
                "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/80 disabled:opacity-60",
                enabled ? "surface-primary glow-amber bg-primary" : "bg-secondary",
              )}
            >
              <span
                className={cn(
                  "size-6 rounded-full bg-white shadow transition-transform",
                  enabled ? "translate-x-7" : "translate-x-1",
                )}
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
