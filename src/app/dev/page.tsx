import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SiteSwitches } from "@/components/dev/site-switches";
import { getSessionProfile } from "@/lib/profile";
import type { SiteMode } from "@/lib/site-status/offline-page";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dev · MuteBites",
  robots: { index: false, follow: false },
};

/**
 * Developer-only controls: the whole-site kill switch and maintenance mode
 * (public.site_status). Only emails in public.developers get the page —
 * everyone else, admins included, gets a 404. The proxy keeps /dev
 * (and /login?dev) reachable while the site is down so it can be switched back.
 */
export default async function DevPage() {
  const { user } = await getSessionProfile();
  if (!user) redirect("/login?dev");

  const supabase = await createClient();
  const { data: isDeveloper } = await supabase.rpc("is_developer");
  if (isDeveloper !== true) notFound();

  const { data: site } = await supabase
    .from("site_status")
    .select("mode, message, updated_at")
    .maybeSingle<{ mode: SiteMode; message: string | null; updated_at: string }>();

  return (
    <main className="mx-auto w-full max-w-xl px-4 pt-8 pb-16">
      <h1 className="font-heading text-headline font-bold">Dev controls</h1>
      <p className="mt-1 text-muted-foreground">
        Signed in as {user.email}. What you switch on here applies to everyone, you included — only this page stays up.
      </p>
      <div className="mt-6">
        <SiteSwitches
          mode={site?.mode ?? "live"}
          message={site?.message ?? null}
          updatedAt={site?.updated_at ?? null}
        />
      </div>
    </main>
  );
}
