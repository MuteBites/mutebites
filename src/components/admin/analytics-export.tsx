"use client";

import { useTransition } from "react";
import { Download, Loader2 } from "lucide-react";
import { getRangeOrders } from "@/lib/admin/analytics-actions";
import { istDayKey } from "@/lib/date";
import { toast } from "@/lib/toast/store";
import { downloadOrdersCsv } from "./export-orders-button";

/**
 * Analytics' "Export to Excel": every order in the chosen range (cancelled
 * ones too, with their status) as a .csv — the same columns as Order
 * history's export. Fetched on tap, so the page itself stays light.
 */
export function AnalyticsExport({ range, label }: { range: string; label: string }) {
  const [pending, startTransition] = useTransition();

  function exportCsv() {
    startTransition(async () => {
      const result = await getRangeOrders(range);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.orders.length === 0) {
        toast.error("No orders in this range to export.");
        return;
      }
      const today = istDayKey(new Date().toISOString());
      const from = istDayKey(result.from);
      downloadOrdersCsv(result.orders, `mutebites-orders-${from === today ? today : `${from}-to-${today}`}.csv`);
      toast.success(`Exported ${result.orders.length} orders.`);
    });
  }

  return (
    <button
      type="button"
      onClick={exportCsv}
      disabled={pending}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-soft text-sm font-semibold text-brand-soft-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/80 disabled:opacity-70"
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Download className="size-4" aria-hidden="true" />}
      Export {label.toLowerCase()} to Excel (CSV)
    </button>
  );
}
