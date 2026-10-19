import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { offlineResponse, type SiteMode } from "@/lib/site-status/offline-page";

// Routes a signed-out visitor may open. Everything else bounces to /login.
// /privacy and /terms must stay public — Google's OAuth consent-screen
// review fetches them signed out.
const PUBLIC_PATHS = ["/login", "/auth", "/privacy", "/terms"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

// Reachable while the site is killed / in maintenance — only what a
// developer needs to get back in and switch it off: /dev itself, the OAuth
// callback, and /login with ?dev (plain /login is blocked like the rest).
function isSiteGateExempt(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (pathname === "/dev" || pathname.startsWith("/auth/")) return true;
  return pathname === "/login" && searchParams.has("dev");
}

// site_status is read on every request, so it's cached per server instance
// for a few seconds and never allowed to hold a page up: a read slower than
// SITE_TIMEOUT_MS (or failing) counts as live. A switch on /dev therefore
// reaches every instance within SITE_CACHE_MS.
const SITE_CACHE_MS = 5_000;
const SITE_TIMEOUT_MS = 1_200;
type SiteRow = { mode: SiteMode; message: string | null };
let siteCache: { at: number; row: SiteRow | null } | null = null;

async function readSiteStatus(supabase: ReturnType<typeof createServerClient>): Promise<SiteRow | null> {
  if (siteCache && Date.now() - siteCache.at < SITE_CACHE_MS) return siteCache.row;
  try {
    const { data, error } = await supabase
      .from("site_status")
      .select("mode, message")
      .abortSignal(AbortSignal.timeout(SITE_TIMEOUT_MS))
      .maybeSingle();
    if (error) return siteCache?.row ?? null;
    const row = data as SiteRow | null;
    siteCache = { at: Date.now(), row };
    return row;
  } catch {
    return siteCache?.row ?? null;
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // The site switch is read alongside the session check, not after it.
  const sitePromise = isSiteGateExempt(request) ? null : readSiteStatus(supabase);

  // Refreshes the session cookie if expired. Required for Server Components,
  // which can't write cookies themselves.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Developer kill switch / maintenance (/dev, public.site_status). While
  // it's on, every page, server action and RSC request gets the offline
  // screen — for everyone, students, admins and developers alike — except
  // the way back in above. A failed read (e.g. before the table existed)
  // counts as live.
  if (sitePromise) {
    const site = await sitePromise;
    if (site && site.mode !== "live") return offlineResponse(site.mode, site.message);
  }

  // Optimistic redirects only — pages still verify the user themselves.
  if (!user && !isPublicPath(pathname)) {
    if (pathname === "/dev") return redirectWithCookies(request, supabaseResponse, "/login", "dev");
    return redirectWithCookies(request, supabaseResponse, "/login");
  }
  if (user && pathname === "/login") {
    const dev = request.nextUrl.searchParams.has("dev");
    return redirectWithCookies(request, supabaseResponse, dev ? "/dev" : "/");
  }

  return supabaseResponse;
}

// A redirect must carry over any refreshed session cookies, or the browser
// and server fall out of sync and the user gets signed out.
function redirectWithCookies(
  request: NextRequest,
  from: NextResponse,
  pathname: string,
  search = "",
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = search;
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
