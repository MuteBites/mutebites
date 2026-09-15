import { AdminHeader } from "@/components/admin/admin-header";
import { requireAdmin } from "@/lib/admin/guard";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-16 sm:px-6">
      <AdminHeader />
      <div className="mt-6 flex flex-col gap-6">{children}</div>
    </main>
  );
}
