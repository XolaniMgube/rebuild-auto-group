"use server";

import type { AuthFormState } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";

export async function requestPasswordReset(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error?.status === 429) return { error: "Too many requests. Try again in a few minutes.", email };
  // Same reply whether or not the account exists.
  return { message: "If that email has an account, a reset link is on its way.", email };
}
