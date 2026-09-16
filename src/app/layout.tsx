import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Outfit, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { Toaster } from "@/components/toast/toaster";
import { THEME_INIT_SCRIPT } from "@/lib/theme/init-script";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
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
  themeColor: "#fdfbf7",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // The theme-init script (and later, useThemePreference) can add the
      // "dark" class / colorScheme style before React hydrates — expected,
      // not a real mismatch.
      suppressHydrationWarning
      className={`${jakarta.variable} ${outfit.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
