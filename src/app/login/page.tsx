import type { Metadata } from "next";
import { BrandLogo } from "@/components/brand-logo";
import { GoogleSignInButton } from "./google-sign-in-button";

export const metadata: Metadata = {
  title: "Sign in · MuteBites",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;

  return (
    <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center overflow-hidden px-6 py-12">
      <div
        aria-hidden="true"
        className="animate-gradient-drift-a pointer-events-none absolute -top-24 -left-16 size-72 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--glow-afternoon) 22%, transparent), transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="animate-gradient-drift-b pointer-events-none absolute -right-20 -bottom-24 size-80 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--glow-night) 20%, transparent), transparent 70%)",
        }}
      />

      <BrandLogo priority className="animate-pop-in relative" />

      <h1
        className="animate-slide-up-in relative mt-10 text-center font-heading text-[2.75rem] leading-[1.1] font-bold tracking-tight"
        style={{ animationDelay: "90ms" }}
      >
        Good food.
        <br />
        Campus mood.
      </h1>

      <div
        className="animate-slide-up-in relative mt-10 w-full"
        style={{ animationDelay: "170ms" }}
      >
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-xl bg-brand-soft px-4 py-3 text-center text-sm text-brand-soft-foreground"
          >
            Sign-in didn&apos;t go through — give it another shot.
          </p>
        )}
        <GoogleSignInButton />
      </div>
    </main>
  );
}
