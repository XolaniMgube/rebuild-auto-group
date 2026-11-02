import type { CookieOptions } from "@supabase/ssr";

// The daily lock. Supabase keeps the session alive for weeks so nobody retypes
// their password every morning; this adds a once-a-day password check on top,
// so a phone in the wrong hands doesn't hand over the workshop's money.
//
// Row level security is still what protects the data. This is a theft and
// shoulder-surfing gate, enforced in middleware so the browser can't skip it.

export const UNLOCK_COOKIE = "rag_unlock";
export const PERSIST_COOKIE = "rag_persist";
export const LOCK_PATH = "/lock";

const UNLOCK_HOURS = 24;
const UNLOCK_MS = UNLOCK_HOURS * 60 * 60 * 1000;
const secure = process.env.NODE_ENV === "production";

/** The unlock is tied to the session that made it and carries its own expiry. */
function unlockValue(sessionId: string) {
  return `${sessionId}.${Date.now() + UNLOCK_MS}`;
}

export function isUnlocked(cookieValue: string | undefined, sessionId: unknown): boolean {
  if (!cookieValue || typeof sessionId !== "string" || !sessionId) return false;
  const [id, expiresAt] = cookieValue.split(".");
  return id === sessionId && Number(expiresAt) > Date.now();
}

/** Set after signing in and after each unlock. */
export function unlockCookie(sessionId: string, remembered: boolean) {
  return {
    name: UNLOCK_COOKIE,
    value: unlockValue(sessionId),
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    // Without "remember me" it goes when the browser closes, like the session.
    ...(remembered ? { maxAge: UNLOCK_HOURS * 60 * 60 } : {}),
  };
}

export function persistenceCookie(remembered: boolean) {
  return {
    name: PERSIST_COOKIE,
    value: remembered ? "1" : "0",
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    ...(remembered ? { maxAge: 400 * 24 * 60 * 60 } : {}),
  };
}

/**
 * With "remember me" off, the Supabase auth cookies become browser-session
 * cookies: closing the browser signs the person out on that device. Cookie
 * removals (an empty value) keep their own options so sign-out still works.
 */
export function withPersistence(options: CookieOptions, remembered: boolean, value: string): CookieOptions {
  if (remembered || !value) return options;
  return { ...options, maxAge: undefined, expires: undefined };
}

export const isRemembered = (cookieValue: string | undefined) => cookieValue !== "0";
