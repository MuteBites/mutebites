import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export const metadata: Metadata = { title: "Privacy Policy · MuteBites" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-md px-6 py-12">
      <Link href="/" className="inline-flex items-center gap-2.5">
        <BrandLogo className="size-10 rounded-xl" />
        <span className="font-heading text-lg font-bold">MuteBites</span>
      </Link>

      <h1 className="mt-8 font-heading text-3xl font-bold tracking-tight">Privacy Policy</h1>

      <div className="mt-6 flex flex-col gap-4 leading-relaxed text-muted-foreground">
        <p>
          MuteBites collects your name, phone number, and email (via Google sign-in) to process
          food orders for VIT-AP University students.
        </p>
        <p>We don&apos;t sell or share this data with third parties.</p>
        <p>Orders are shared with partner restaurants to fulfill delivery.</p>
        <p>
          Contact{" "}
          <a href="mailto:mutebites5@gmail.com" className="font-semibold text-primary hover:underline">
            mutebites5@gmail.com
          </a>{" "}
          with any questions.
        </p>
      </div>

      <Link
        href="/"
        className="mt-10 inline-block font-semibold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        ← Back to MuteBites
      </Link>
    </main>
  );
}
