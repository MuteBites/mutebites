"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  // "local": sign out of THIS device only. Supabase's default is "global",
  // which revokes the account's sessions everywhere — signing out on a lab
  // computer would log the student out on their phone too.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
