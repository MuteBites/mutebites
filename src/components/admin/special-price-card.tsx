"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgePercent } from "lucide-react";
import { IconTile } from "@/components/icon-tile";
import { Switch } from "@/components/admin/offers-card";
import { setSpecialPriceEnabled } from "@/lib/admin/actions";
import { SPECIAL_PRICE } from "@/lib/partners";
import { toast } from "@/lib/toast/store";

/** Spice Magic's ₹170 offer switch on /admin/offers (28 Nov 2026). */
export function SpecialPriceCard({ on }: { on: boolean }) {
  const router = useRouter();
  const [checked, setChecked] = useState(on);
  const [prev, setPrev] = useState(on);
  if (on !== prev) {
    setPrev(on);
    setChecked(on);
  }
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !checked;
    setChecked(next);
    startTransition(async () => {
      const res = await setSpecialPriceEnabled(next);
      if (!res.ok) {
        setChecked(!next);
        toast.error(res.error);
        return;
      }
      toast.success(`${SPECIAL_PRICE.restaurant} ₹${SPECIAL_PRICE.price} offer ${next ? "on" : "off"}`);
      router.refresh();
    });
  }

  return (
    <section className="flex items-center gap-3.5 rounded-[1.5rem] border bg-card px-5 py-4 shadow-card">
      <IconTile>
        <BadgePercent className="size-5" aria-hidden="true" />
      </IconTile>
      <div className="min-w-0 flex-1">
        <p id="special-price" className="font-semibold">
          {SPECIAL_PRICE.restaurant} · ₹{SPECIAL_PRICE.price} biryanis
        </p>
        <p className="text-sm text-muted-foreground">{SPECIAL_PRICE.title}</p>
      </div>
      <Switch checked={checked} labelledBy="special-price" disabled={pending} onClick={toggle} />
    </section>
  );
}
