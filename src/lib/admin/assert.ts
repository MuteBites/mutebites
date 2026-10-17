import "server-only";

import { getSessionProfile } from "@/lib/profile";

/**
 * Every admin action is only ever reachable from /admin, itself gated by
 * requireAdmin(). This is a friendly early exit for a direct call — the
 * real boundary is RLS: every write also checks public.is_admin().
 */
export async function assertAdmin(): Promise<{ ok: false; error: string } | null> {
  const { profile } = await getSessionProfile();
  if (!profile || profile.role !== "admin") return { ok: false, error: "Admins only." };
  return null;
}
