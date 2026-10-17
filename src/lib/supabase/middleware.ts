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
  if (!isSiteGateExempt(request)) {
    const { data: site } = await supabase
      .from("site_status")
      .select("mode, message")
      .maybeSingle<{ mode: SiteMode; message: string | null }>();
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
