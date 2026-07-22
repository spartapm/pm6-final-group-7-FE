import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEV_AUTH_COOKIE, useDevAuthSession } from "@/lib/constants";

const PUBLIC_PATHS = ["/", "/login", "/auth/callback"];
const AUTH_PAGES = ["/login"];

/** IV-26: 게스트 조회 허용 — 홈·목록·상세·캘린더·마이(루트) */
const GUEST_BROWSE_EXACT = new Set(["/home", "/jobs", "/learning", "/calendar", "/my"]);
const GUEST_BROWSE_PREFIXES = ["/activities"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isOnboarding(pathname: string) {
  return pathname.startsWith("/onboarding");
}

function isGuestBrowse(pathname: string) {
  if (GUEST_BROWSE_EXACT.has(pathname)) return true;
  return GUEST_BROWSE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function requiresAuth(pathname: string) {
  if (isPublic(pathname) || isOnboarding(pathname) || isGuestBrowse(pathname)) return false;
  return true;
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (useDevAuthSession()) {
    const devSession = request.cookies.get(DEV_AUTH_COOKIE)?.value === "1";
    if (!devSession && requiresAuth(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    if (devSession && pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/home";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && requiresAuth(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && AUTH_PAGES.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  return response;
}
