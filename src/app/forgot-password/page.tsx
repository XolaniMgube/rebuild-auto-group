"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthCard, FormMessage } from "@/components/AuthCard";
import { Button, buttonClass, Field, Input } from "@/components/ui";
import { requestPasswordReset } from "./actions";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  return (
    <AuthCard title="Reset password" description="We'll email you a link to choose a new password.">
      <form action={action} className="space-y-5">
        <div className="card p-5">
          <Field label="Email">
            <Input name="email" type="email" autoComplete="username" required defaultValue={state?.email} placeholder="you@rebuildautogroup.co.za" />
          </Field>
        </div>
        <FormMessage error={state?.error} message={state?.message} />
        <Button type="submit" block loading={pending}>{pending ? "Sending…" : "Send reset link"}</Button>
        <Link href="/login" className={buttonClass({ variant: "plain", block: true })}>Back to sign in</Link>
      </form>
    </AuthCard>
  );
}
