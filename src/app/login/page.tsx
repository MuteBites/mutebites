import type { Metadata } from "next";
import { BrandLogo } from "@/components/brand-logo";
import { GoogleSignInButton } from "./google-sign-in-button";

export const metadata: Metadata = {
  title: "Sign in · MuteBites",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-12">
      <BrandLogo priority />

      <h1 className="mt-10 text-center font-heading text-[2.75rem] leading-[1.1] font-bold tracking-tight">
        Good food.
        <br />
        Campus mood.
      </h1>

      <div className="mt-10 w-full">
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-xl bg-brand-soft px-4 py-3 text-center text-sm text-brand-soft-foreground"
          >
            Sign-in didn&apos;t go through. Please try again.
          </p>
        )}
        <GoogleSignInButton />
      </div>
    </main>
  );
}
