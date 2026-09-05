"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GearMark } from "@/components/Logo";
import { Button, Field, Input } from "@/components/ui";
import { useStore } from "@/lib/store";
import { checkDemoCredentials, DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo-auth";

export default function LoginPage() {
  const router = useRouter();
  const signIn = useStore((s) => s.signIn);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const userId = checkDemoCredentials(email, password);
    if (!userId) {
      setError("That email and password don't match. Check both and try again.");
      return;
    }
    signIn(userId);
    router.push("/search");
  }

  return (
    <main className="min-h-dvh bg-[#eef2f7] flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 py-10 max-w-[440px] w-full mx-auto">
        <GearMark className="h-16 w-16 mb-6" />

        <h1 className="font-narrow text-[28px] font-bold leading-tight">
          <span className="text-brand-red">Rebuild</span>{" "}
          <span className="text-brand-blue">Auto Group</span>
        </h1>
        <p className="text-[15px] text-slate font-medium mt-2">
          Every part has a place. Every car has a plan.
        </p>

        <Button className="mt-7 w-full" onClick={() => { signIn("u_mitchel"); router.push("/search"); }}>Explore the demo →</Button>
        <p className="text-xs text-slate text-center mt-4">Or sign in to the demo workspace</p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <Field label="Email">
            <Input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="you@rebuildautogroup.co.za"
            />
          </Field>

          <Field label="Password">
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="••••••••"
            />
          </Field>

          {error && (
            <p className="text-[13px] font-semibold text-brand-red bg-brand-redTint rounded-lg px-3 py-2.5">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>

        {/* Demo convenience. Remove this block along with lib/demo-auth.ts. */}
        <div className="mt-8 rounded-lg border border-hairline bg-paper px-4 py-3">
          <p className="text-[12px] font-bold text-slate">Preview build</p>
          <p className="text-[12.5px] text-slate mt-1 leading-relaxed">
            Sign in with <span className="font-semibold text-ink">{DEMO_EMAIL}</span>{" "}
            and <span className="font-semibold text-ink">{DEMO_PASSWORD}</span>. Nothing
            here is real stock — it&apos;s sample data so you can click around.
          </p>
        </div>
      </div>
    </main>
  );
}
