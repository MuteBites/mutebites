import type { Metadata } from "next";
import Link from "next/link";
import { ShieldBan } from "lucide-react";
import { BackToDashboardLink } from "@/components/admin/back-to-dashboard-link";
import { UsersList } from "@/components/admin/users-list";
import { getAllUsers } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Users · MuteBites Admin" };

export default async function AdminUsersPage() {
  const users = await getAllUsers();

  return (
    <>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <BackToDashboardLink />
          <Link
            href="/admin/banned"
            className="flex h-9 items-center gap-1.5 rounded-xl border bg-card px-3 text-sm font-semibold outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            <ShieldBan className="size-3.5" />
            Banned users
          </Link>
        </div>
        <h1 className="mt-2 font-heading text-title font-bold">Users</h1>
        <p className="mt-1 text-muted-foreground">
          Everyone registered on MuteBites — {users.length} total.
        </p>
      </div>

      <UsersList users={users} />
    </>
  );
}
