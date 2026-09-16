import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Shared "Back to dashboard" button for admin sub-pages (history, banned users). */
export function BackToDashboardLink() {
  return (
    <Link
      href="/admin"
      className="flex h-9 items-center gap-1.5 rounded-xl border bg-card px-3 text-sm font-semibold outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/40"
    >
      <ArrowLeft className="size-3.5" />
      Back to dashboard
    </Link>
  );
}
