"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/AuthCard";
import { Icon } from "@/components/Icon";
import { Button, Field, PasswordInput } from "@/components/ui";
import { unlock } from "./actions";

export function LockForm({ email, next }: { email: string; next?: string }) {
  const [state, action, pending] = useActionState(unlock, undefined);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      {/* Here for password managers: they fill the password once they can see the account. */}
      <input type="email" name="email" value={email} readOnly autoComplete="username" aria-hidden="true" tabIndex={-1} className="sr-only" />
      <p className="flex items-center gap-2 rounded-2xl bg-subtle px-4 py-3 text-meta text-secondary">
        <Icon name="lock" className="h-4 w-4 shrink-0" />Signed in as <span className="truncate font-semibold text-ink">{email}</span>
      </p>
      <Field label="Password">
        <PasswordInput name="password" autoComplete="current-password" required placeholder="Password" autoFocus />
      </Field>
      <FormMessage error={state?.error} />
      <Button type="submit" block loading={pending}>{pending ? "Unlocking…" : "Unlock"}</Button>
    </form>
  );
}

/** Kept out of the unlock form: a form inside a form is invalid HTML. */
export function LockFooter() {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-meta">
      <form action="/auth/signout" method="post">
        <button type="submit" className="min-h-11 rounded-lg px-2 font-semibold text-brand-navy transition hover:bg-brand-navy-tint">Not you? Sign out</button>
      </form>
      <form action="/auth/signout-all" method="post">
        <button type="submit" className="min-h-11 rounded-lg px-2 font-medium text-secondary transition hover:text-ink">Sign out on all devices</button>
      </form>
    </div>
  );
}
