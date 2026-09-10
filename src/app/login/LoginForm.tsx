"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormMessage } from "@/components/AuthCard";
import { Button, buttonClass, Field, Input } from "@/components/ui";
import { signIn } from "./actions";

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action, pending] = useActionState(signIn, undefined);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next ?? ""} />
      <div className="card space-y-4 p-5">
        <Field label="Email">
          <Input name="email" type="email" autoComplete="username" required defaultValue={state?.email} placeholder="you@rebuildautogroup.co.za" />
        </Field>
        <Field label="Password">
          <Input name="password" type="password" autoComplete="current-password" required placeholder="Password" />
        </Field>
      </div>
      <FormMessage error={state?.error ?? notice} />
      <Button type="submit" block loading={pending}>{pending ? "Signing in…" : "Sign in"}</Button>
      <Link href="/forgot-password" className={buttonClass({ variant: "plain", block: true })}>Forgot password?</Link>
    </form>
  );
}
