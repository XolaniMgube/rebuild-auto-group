"use client";

import { useActionState } from "react";
import { AuthCard, FormMessage } from "@/components/AuthCard";
import { Button, Field, PasswordInput } from "@/components/ui";
import { updatePassword } from "./actions";

export default function UpdatePasswordPage() {
  const [state, action, pending] = useActionState(updatePassword, undefined);

  return (
    <AuthCard title="Choose a password">
      <form action={action} className="space-y-4">
        <Field label="New password" hint="At least 10 characters, with upper- and lowercase letters and a number.">
          <PasswordInput name="password" autoComplete="new-password" minLength={10} required />
        </Field>
        <Field label="Confirm password">
          <PasswordInput name="confirm" autoComplete="new-password" minLength={10} required />
        </Field>
        <FormMessage error={state?.error} />
        <Button type="submit" block loading={pending}>{pending ? "Saving…" : "Save password"}</Button>
      </form>
    </AuthCard>
  );
}
