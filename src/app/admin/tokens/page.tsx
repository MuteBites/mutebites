import type { Metadata } from "next";
import { BackToDashboardLink } from "@/components/admin/back-to-dashboard-link";
import { TokenBlocker } from "@/components/admin/token-blocker";
import { istDayKey } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Block order number · MuteBites Admin" };
export const dynamic = "force-dynamic";

/** How many of the numbers still ahead today are offered. */
const AHEAD = 60;

export default async function AdminTokensPage() {
  const supabase = await createClient();
  const day = istDayKey(new Date().toISOString());
  const [{ data: counter }, { data: blocked }] = await Promise.all([
    supabase.from("daily_order_counters").select("last_number").eq("order_day", day).maybeSingle(),
    supabase.from("blocked_tokens").select("number").eq("day", day),
  ]);
  const last = counter?.last_number ?? 0;
  const blockedSet = new Set((blocked ?? []).map((b) => b.number as number));

  // Only numbers not given out yet; 5 is never used anyway.
  const numbers: number[] = [];
  for (let n = last + 1; numbers.length < AHEAD; n++) if (n !== 5) numbers.push(n);
  for (const n of blockedSet) if (n > last && !numbers.includes(n)) numbers.push(n);
  numbers.sort((a, b) => a - b);

  return (
    <>
      <div>
        <BackToDashboardLink href="/admin/more" label="Back to More" />
        <h1 className="mt-4 font-heading text-headline font-bold">Block order number</h1>
        <p className="mt-1 text-muted-foreground">
          Tap a number to block it for today — orders skip it (block 3 and they go 1, 2, 4 …). Tap
          again to unblock. Numbers already given out today aren&apos;t shown; 5 is always skipped.
        </p>
      </div>

      <TokenBlocker
        numbers={numbers}
        blocked={[...blockedSet].filter((n) => n > last)}
        lastTaken={last}
      />
    </>
  );
}
