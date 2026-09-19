import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { AppSplash } from "@/components/splash/app-splash";
import { SPLASH_DISABLED } from "@/components/splash/config";
import { SPLASH_INIT_SCRIPT } from "@/components/splash/init-script";
import { Toaster } from "@/components/toast/toaster";
import { THEME_INIT_SCRIPT } from "@/lib/theme/init-script";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

// Display face. Only the SOFT axis (rounded terminals, set in
// globals.css) on top of weight: adding opsz as well took the preloaded
// Fraunces file from 62KB to 121KB, for a display cut this app's bold
// headings barely show.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT"],
});

export const metadata: Metadata = {
  title: "MuteBites",
  description: "Good food. Campus mood. Food delivery for VIT-AP students.",
  appleWebApp: {
    capable: true,
    title: "MuteBites",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  // Matches --background in globals.css. Follows the OS scheme only — an
  // in-app theme override can't retarget this meta tag before paint.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf3ec" },
    { media: "(prefers-color-scheme: dark)", color: "#170f14" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // The theme-init script (and later, useThemePreference) can add the
      // "dark" class / colorScheme style, and the splash-init script
      // data-splash, before React hydrates — expected, not a real mismatch.
      suppressHydrationWarning
      className={`${jakarta.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Raw inline <script>, not next/script: beforeInteractive inline
            scripts are queued (self.__next_s) until Next's own JS loads, so
            a dark-mode user would see a flash of the light theme first.
            This runs as the parser reaches it, before anything is painted. */}
        <script id="theme-init" dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {!SPLASH_DISABLED && (
          <>
            {/* A plain inline <script>, not next/script: beforeInteractive
                inline scripts are queued (self.__next_s) until Next's own JS
                loads, so the app would paint first and the splash would pop
                in over it. This runs as the parser reaches it — before
                anything below is painted. */}
            <script id="splash-init" dangerouslySetInnerHTML={{ __html: SPLASH_INIT_SCRIPT }} />
            {/* Right after, so it's in the first streamed chunk. */}
            <AppSplash />
          </>
        )}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
