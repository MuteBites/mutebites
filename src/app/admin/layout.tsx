import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminPasscodeGate } from "@/components/admin/admin-passcode-gate";
import { AdminTabBar } from "@/components/admin/admin-tab-bar";
import { requireAdmin } from "@/lib/admin/guard";
import { isAdminPasscodeVerified } from "@/lib/admin/passcode";

// Never in search results (robots.txt also disallows /admin).
// Its own install profile: "MuteBites Admin" opens straight on /admin.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  manifest: "/admin.webmanifest",
  appleWebApp: { capable: true, title: "MB Admin", statusBarStyle: "default" },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();

  // Second layer on top of the role check above: even a signed-in admin
  // needs this browser session to know the separate ADMIN_PASSCODE too.
  if (!(await isAdminPasscodeVerified(admin.id))) {
    return <AdminPasscodeGate />;
  }

  return (
    <>
      {/* pb-28: room for the floating AdminTabBar. */}
      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 sm:px-6">
        <AdminHeader />
        <div className="mt-6 flex flex-col gap-5">{children}</div>
      </main>
      <AdminTabBar />
    </>
  );
}
