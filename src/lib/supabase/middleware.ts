import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isRemembered, isUnlocked, LOCK_PATH, PERSIST_COOKIE, UNLOCK_COOKIE, withPersistence } from "@/lib/lock";
import type { Database } from "@/lib/database.types";
import { supabaseEnv } from "./env";

const SIGNED_OUT_PAGES = ["/login", "/forgot-password"];

function isPublic(pathname: string) {
  return SIGNED_OUT_PAGES.includes(pathname) || pathname.startsWith("/auth/");
}

// Refreshes the session cookie on every request, keeps signed-out visitors on
// the sign-in pages, and sends anyone whose daily unlock has run out to the
// lock screen. This is a convenience gate: row level security in the database
// is what actually protects the data.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = supabaseEnv();
  const remembered = isRemembered(request.cookies.get(PERSIST_COOKIE)?.value);

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, withPersistence(options, remembered, value))
        );
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Keep this directly after createServerClient. getClaims() verifies the
  // token signature; getSession() would trust whatever the cookie says.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);
  const { pathname, search } = request.nextUrl;

  if (!signedIn && !isPublic(pathname)) {
    const to = new URL("/login", request.url);
    if (pathname !== "/") to.searchParams.set("next", pathname + search);
    return redirectKeepingCookies(to, response);
  }

  if (signedIn && SIGNED_OUT_PAGES.includes(pathname)) {
    return redirectKeepingCookies(new URL("/search", request.url), response);
  }

  if (signedIn && !isPublic(pathname)) {
    // Server Actions post to the page they came from, so this covers writes too.
    const unlocked = isUnlocked(request.cookies.get(UNLOCK_COOKIE)?.value, data?.claims?.session_id);
    if (!unlocked && pathname !== LOCK_PATH) {
      const to = new URL(LOCK_PATH, request.url);
      if (pathname !== "/") to.searchParams.set("next", pathname + search);
      return redirectKeepingCookies(to, response);
    }
    if (unlocked && pathname === LOCK_PATH) {
      return redirectKeepingCookies(new URL("/search", request.url), response);
    }
  }

  // Responses that may carry a refreshed session must never be cached.
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

function redirectKeepingCookies(to: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(to);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  redirect.headers.set("Cache-Control", "private, no-store");
  return redirect;
}
