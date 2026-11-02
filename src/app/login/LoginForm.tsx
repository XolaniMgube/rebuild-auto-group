"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormMessage } from "@/components/AuthCard";
import { Button, CheckCircle, Field, Input, PasswordInput } from "@/components/ui";
import { signIn } from "./actions";

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action, pending] = useActionState(signIn, undefined);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Email">
        <Input name="email" type="email" inputMode="email" autoComplete="username" autoCapitalize="none" required defaultValue={state?.email} placeholder="you@rebuildautogroup.com" />
      </Field>
      <div>
        <Field label="Password">
          <PasswordInput name="password" autoComplete="current-password" required placeholder="Password" />
        </Field>
        <div className="mt-1 flex items-center justify-between gap-3">
          <label className="-ml-1 inline-flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl px-1 text-[14px] font-medium">
            <CheckCircle name="remember" defaultChecked />Stay signed in
          </label>
          <Link href="/forgot-password" className="-mr-2 inline-flex min-h-11 items-center rounded-xl px-2 text-[14px] font-semibold text-brand-navy transition hover:bg-brand-navy-tint">Forgot password?</Link>
        </div>
      </div>
      <FormMessage error={state?.error ?? notice} />
      <Button type="submit" block loading={pending}>{pending ? "Signing in…" : "Sign in"}</Button>
    </form>
  );
}
