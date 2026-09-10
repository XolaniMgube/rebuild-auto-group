"use server";

import { redirect } from "next/navigation";
import type { AuthFormState } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";

export async function updatePassword(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 10 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return { error: "Use at least 10 characters, with upper- and lowercase letters and a number." };
  }
  if (password !== confirm) return { error: "The passwords don't match." };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "weak_password") return { error: "That password is too easy to guess. Try another." };
    if (error.code === "same_password") return { error: "Choose a different password from your current one." };
    return { error: "Couldn't update your password. Request a new link and try again." };
  }

  redirect("/search");
}
