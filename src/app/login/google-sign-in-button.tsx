"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function GoogleSignInButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
    // On success the browser is already navigating to Google.
    if (error) {
      setError("Couldn't reach Google — check your connection and try again.");
      setPending(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {/* Google's own light button (their branding guidance): white, the grey
          #747775 outline, #1F1F1F text — fixed colours in both themes, with a
          warm glow under it so it still reads as the page's action. "ghost",
          not the default variant: the default's lit amber gradient is a
          background-image that bg-white can't override. */}
      <Button
        variant="ghost"
        onClick={signIn}
        disabled={pending}
        className="glow-amber h-14 w-full gap-3 rounded-full border border-[#747775] bg-white text-base font-semibold text-[#1f1f1f] hover:bg-[#f8f8f8] hover:text-[#1f1f1f] dark:hover:bg-[#f8f8f8]"
      >
        <span className="flex size-8 items-center justify-center rounded-full">
          {pending ? (
            <Loader2 className="size-4 animate-spin text-plum-700" />
          ) : (
            <GoogleIcon />
          )}
        </span>
        {pending ? "Opening Google…" : "Continue with Google"}
      </Button>
      {error && (
        <p role="alert" className="text-center text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.28A7.2 7.2 0 0 1 4.91 12c0-.79.14-1.56.38-2.28V6.61H1.28a12 12 0 0 0 0 10.78l4.01-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.28 6.61l4.01 3.11C6.23 6.88 8.88 4.77 12 4.77Z"
      />
    </svg>
  );
}
