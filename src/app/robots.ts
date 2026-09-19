import type { MetadataRoute } from "next";

// Everything but the admin area can be crawled. Signed-out crawlers only
// ever reach /login, /privacy and /terms anyway (src/proxy.ts sends the
// rest to /login); this file exists so /robots.txt itself is a real
// robots file instead of that redirect — it's excluded from the proxy
// matcher for the same reason.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
  };
}
