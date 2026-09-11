"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthCard, FormMessage } from "@/components/AuthCard";
import { Icon } from "@/components/Icon";
import { Button, buttonClass, Field, Input } from "@/components/ui";
import { requestPasswordReset } from "./actions";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  return (
    <AuthCard title="Reset password" description="We'll email you a link to choose a new password.">
      <form action={action} className="space-y-4">
        <Field label="Email">
          <Input name="email" type="email" inputMode="email" autoComplete="username" autoCapitalize="none" required defaultValue={state?.email} placeholder="you@rebuildautogroup.com" />
        </Field>
        <FormMessage error={state?.error} message={state?.message} />
        <Button type="submit" block loading={pending}>{pending ? "Sending…" : "Send reset link"}</Button>
        <Link href="/login" className={buttonClass({ variant: "plain", block: true })}><Icon name="chevron-left" className="h-5 w-5" />Back to sign in</Link>
      </form>
    </AuthCard>
  );
}
