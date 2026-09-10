"use client";

import { useActionState } from "react";
import { AuthCard, FormMessage } from "@/components/AuthCard";
import { Button, Field, Input } from "@/components/ui";
import { updatePassword } from "./actions";

export default function UpdatePasswordPage() {
  const [state, action, pending] = useActionState(updatePassword, undefined);

  return (
    <AuthCard title="Choose a password">
      <form action={action} className="space-y-5">
        <div className="card space-y-4 p-5">
          <Field label="New password" hint="At least 10 characters, with upper- and lowercase letters and a number.">
            <Input name="password" type="password" autoComplete="new-password" minLength={10} required />
          </Field>
          <Field label="Confirm password">
            <Input name="confirm" type="password" autoComplete="new-password" minLength={10} required />
          </Field>
        </div>
        <FormMessage error={state?.error} />
        <Button type="submit" block loading={pending}>{pending ? "Saving…" : "Save password"}</Button>
      </form>
    </AuthCard>
  );
}
