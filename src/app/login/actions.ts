"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { persistenceCookie, unlockCookie } from "@/lib/lock";
import { safeNext } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = { error?: string; message?: string; email?: string } | undefined;

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password.", email };

  // Set before the client is made: it decides whether the session cookies
  // survive closing the browser.
  const remember = formData.get("remember") !== null;
  const store = await cookies();
  store.set(persistenceCookie(remember));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.status === 429) return { error: "Too many attempts. Wait a few minutes and try again.", email };
    // One message for every failure, so the form never reveals which emails have accounts.
    return { error: "Email or password is incorrect.", email };
  }

  // They just typed the password, so the day starts unlocked.
  const { data } = await supabase.auth.getClaims();
  const sessionId = data?.claims?.session_id;
  if (typeof sessionId === "string") store.set(unlockCookie(sessionId, remember));

  redirect(safeNext(formData.get("next")));
}
