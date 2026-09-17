import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Shared "back" button for admin sub-pages. Defaults to the main
 * dashboard (history, users), but the banned-users page overrides both
 * props to point at /admin/users instead — that's its actual parent now
 * that it's reached via the Users page rather than the dashboard directly.
 */
export function BackToDashboardLink({
  href = "/admin",
  label = "Back to dashboard",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="flex h-9 items-center gap-1.5 rounded-xl border bg-card px-3 text-sm font-semibold outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/40"
    >
      <ArrowLeft className="size-3.5" />
      {label}
    </Link>
  );
}
