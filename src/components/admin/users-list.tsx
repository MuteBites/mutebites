"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { AdminUser } from "@/lib/data/admin";
import { formatOrderTimestamp } from "@/lib/date";
import { formatStoredMobile } from "@/lib/phone";

export function UsersList({ users }: { users: AdminUser[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(term) ||
        u.phone.includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.registrationNumber?.toLowerCase().includes(term) ?? false),
    );
  }, [query, users]);

  return (
    <div className="flex flex-col gap-4">
      <label className="relative block">
        <span className="sr-only">Search users</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, phone, email, or reg. number…"
          className="h-11 w-full rounded-xl bg-secondary pr-4 pl-10 outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
        />
      </label>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border bg-card p-6 text-center text-muted-foreground">
          No users match “{query.trim()}”.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{user.fullName}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {formatStoredMobile(user.phone)}
                  {user.registrationNumber && ` · ${user.registrationNumber}`}
                </p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {user.isBanned && (
                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive uppercase">
                    Banned
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  Joined {formatOrderTimestamp(user.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
