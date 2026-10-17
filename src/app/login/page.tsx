import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Banknote, MapPin } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { PassArt } from "@/components/theme/pass-art";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
import { GoogleSignInButton } from "./google-sign-in-button";
import { KaapiLoginScene } from "./kaapi-login-scene";
import "./login.css";

// The page search engines land on (everything else needs sign-in), so it
// carries the full search title and a canonical address.
export const metadata: Metadata = {
  title: SITE_TITLE,
  alternates: { canonical: "/login" },
};

// Tells Google who MuteBites is (name, logo, site) — structured data only,
// nothing visible.
const STRUCTURED_DATA = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icons/icon-512`,
      description: SITE_DESCRIPTION,
      areaServed: "VIT-AP University, Amaravati, Andhra Pradesh, India",
    },
    { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
  ],
}).replace(/</g, "\\u003c");

/*
 * The first thing a student sees, so it leads with the real food rather
 * than an empty cream screen: a tilted mosaic of actual menu photos (one
 * or more from every partner kitchen) that fades into the page. Three
 * columns, the middle one dropped half a tile, so it reads as a spread
 * rather than a grid. The mosaic takes whatever height the text block
 * doesn't need (flex-1), so a tall phone gets more food, not a gap above
 * the button. Purely decorative — aria-hidden, empty alts.
 *
 * Plum's motion (17 Oct 2026, its answer to Kaapi's animated scene): the
 * columns drift slowly, the middle one the other way; sparkles twinkle
 * over the food; a rose + amber glow lights where the sheet meets the
 * photos; and a lit plum bubble with the cloche (its lid lifting) floats
 * on the sheet's edge opposite the logo. `plum-login-*` in login.css.
 */
const MOSAIC: string[][] = [
  [
    "/MuteBites/A1 biryani/A1 Mixed Biryani-v2.jpg",
    "/MuteBites/Bismillah fruit juice/Pomegranate juice.jpg",
    "/MuteBites/MuteBites Chinese/Chicken noodles.jpg",
    "/MuteBites/Mutebites fresh fruits/Grapes 1kg.jpg",
  ],
  [
    "/MuteBites/Bheemasena/Paneer 65.jpg",
    "/MuteBites/Mutebites fresh fruits/Dragon fruit 500g.jpg",
    "/MuteBites/MuteBites Chinese/Chicken lollipop 4P.jpg",
    "/MuteBites/MuteBites Chinese/Veg paneer friedrice.jpg",
  ],
  [
    "/MuteBites/MuteBites Chinese/Chicken chilli.jpg",
    "/MuteBites/Bismillah fruit juice/Pineapple juice.jpg",
    "/MuteBites/Bheemasena/Kunda biryani.jpg",
    "/MuteBites/Bheemasena/Chicken tandoori.jpeg",
  ],
];

/** Sparkles over the mosaic: left, top, size, animation delay. */
const SPARKLES: [string, string, number, string][] = [
  ["14%", "22%", 18, "0s"],
  ["58%", "12%", 14, "-0.9s"],
  ["80%", "48%", 20, "-1.7s"],
  ["36%", "62%", 12, "-2.3s"],
];

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;

  return (
    <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: STRUCTURED_DATA }} />
      <div aria-hidden="true" className="relative min-h-44 flex-1 overflow-hidden">
        {/* Desi Kaapi: College Bites' Kaapi scene instead of the mosaic. */}
        <div className="only-kaapi absolute inset-0">
          <KaapiLoginScene />
        </div>
        <div className="plum-login only-plum absolute inset-0">
          <div className="absolute -inset-x-12 -top-16 grid -rotate-6 grid-cols-3 gap-3">
            {MOSAIC.map((column, c) => (
              <div
                key={c}
                className={`plum-login-col flex flex-col gap-3${c === 1 ? " plum-login-col-down pt-16" : ""}`}
                style={{ animationDelay: `${c * -4}s` }}
              >
                {column.map((src, row) => (
                  <div
                    key={src}
                    className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-secondary shadow-card"
                  >
                    {/* The top two rows are what's on screen at load (and hold
                        the LCP image), so they skip lazy-loading. */}
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="(max-width: 448px) 36vw, 160px"
                      loading={row < 2 ? "eager" : "lazy"}
                      fetchPriority={row < 2 ? "high" : undefined}
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-hero/25" />
          <div className="plum-login-glow absolute inset-x-0 bottom-0 h-3/5" />
          {SPARKLES.map(([left, top, size, delay]) => (
            <svg
              key={`${left}-${top}`}
              viewBox="0 0 20 20"
              className="absolute text-white/85 drop-shadow"
              style={{ left, top, width: size, height: size }}
            >
              <path
                className="motif-twinkle"
                style={{ animationDelay: delay }}
                d="M10 0l2.6 7.4L20 10l-7.4 2.6L10 20l-2.6-7.4L0 10l7.4-2.6z"
                fill="currentColor"
              />
            </svg>
          ))}
        </div>
      </div>

      {/* A solid sheet rising over the food, with the logo tile sitting on
          its top edge. The headline only settles (a small rise) — never
          fades from invisible: an element first painted at opacity 0 isn't
          counted as Largest Contentful Paint, and Lighthouse then finds no
          LCP on this page at all (a College Bites lesson). */}
      <div className="relative -mt-8 flex flex-col rounded-t-[2rem] bg-card px-6 pt-0 pb-[max(2rem,env(safe-area-inset-bottom))] shadow-[0_-14px_34px_-18px_var(--glow-hero)]">
        <BrandLogo
          preload
          splashTarget
          className="animate-pop-in -mt-10 size-20 rounded-3xl shadow-raised ring-4 ring-card"
        />
        {/* Plum: a lit bubble with the cloche, floating on the sheet's edge. */}
        <span
          aria-hidden="true"
          className="only-plum surface-hero glow-hero absolute -top-8 right-6 size-16 rounded-full bg-hero ring-4 ring-card"
        >
          <span className="plum-login-bubble absolute inset-0">
            <PassArt className="top-2 left-2" />
          </span>
        </span>

        <h1 className="animate-settle mt-5 font-heading text-display font-bold">
          Good food.
          <br />
          Campus mood.
        </h1>
        <p
          className="animate-slide-up-in mt-3 max-w-[22rem] text-base text-muted-foreground"
          style={{ animationDelay: "130ms" }}
        >
          Biryani, Chinese, fresh juice and fruit from campus kitchens — handed over at VIT-AP
          Main Gate. Pay when you collect.
        </p>
        <ul
          className="animate-slide-up-in mt-4 flex flex-wrap gap-1.5 text-xs font-semibold"
          style={{ animationDelay: "150ms" }}
        >
          <li className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-brand-soft-foreground">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            Free delivery to Main Gate
          </li>
          <li className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-brand-soft-foreground">
            <Banknote className="size-3.5 shrink-0" aria-hidden="true" />
            Pay on delivery — cash or UPI
          </li>
        </ul>

        <div
          className="animate-slide-up-in mt-7 w-full"
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
          <p className="mt-4 text-center text-xs text-muted-foreground">
            By continuing you agree to our{" "}
            <Link href="/terms" className="font-semibold text-foreground underline-offset-2 hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-semibold text-foreground underline-offset-2 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
