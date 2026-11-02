"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isRemembered, PERSIST_COOKIE, unlockCookie } from "@/lib/lock";
import { safeNext } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";
import type { AuthFormState } from "@/app/login/actions";

/** Re-checks the password for the account already signed in, then starts another day. */
export async function unlock(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  if (!password) return { error: "Enter your password to unlock." };

  const supabase = await createClient();
  const { data: current } = await supabase.auth.getClaims();
  const email = current?.claims?.email;
  // The email comes from the session, never the form: unlocking can't switch accounts.
  if (typeof email !== "string" || !email) redirect("/login");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.status === 429) return { error: "Too many attempts. Wait a few minutes and try again." };
    return { error: "That password is incorrect." };
  }

  const store = await cookies();
  const { data: fresh } = await supabase.auth.getClaims();
  const sessionId = fresh?.claims?.session_id;
  if (typeof sessionId === "string") store.set(unlockCookie(sessionId, isRemembered(store.get(PERSIST_COOKIE)?.value)));

  redirect(safeNext(formData.get("next")));
}
