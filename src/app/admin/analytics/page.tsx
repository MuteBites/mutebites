import type { Metadata } from "next";
import { AnalyticsView } from "@/components/admin/analytics-view";
import { getAnalytics, getStudentCount, toAnalyticsRange } from "@/lib/data/analytics";

export const metadata: Metadata = { title: "Analytics · MuteBites Admin" };

/** The admin's Analytics tab: ?range=today | 7 (default) | 30. */
export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string | string[] }> }) {
  const { range: raw } = await searchParams;
  const range = toAnalyticsRange(raw);
  const [{ current, previous, fromIso }, students] = await Promise.all([getAnalytics(range), getStudentCount()]);

  return (
    <>
      <h1 className="font-heading text-headline font-bold">Analytics</h1>
      <AnalyticsView key={range} range={range} students={students} current={current} previous={previous} fromIso={fromIso} />
    </>
  );
}
