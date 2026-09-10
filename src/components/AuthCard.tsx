import type { ReactNode } from "react";
import { BrandLogo } from "./Logo";
import { Notice } from "./ui";

export function AuthCard({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return <main className="flex min-h-dvh flex-col px-5" style={{ paddingTop: "max(48px, env(safe-area-inset-top))", paddingBottom: "max(32px, env(safe-area-inset-bottom))" }}>
    <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col sm:justify-center sm:pb-16">
      <BrandLogo priority sizes="140px" className="w-[140px]" />
      <h1 className="mt-10 text-large-title">{title}</h1>
      {description && <p className="mt-2 text-body text-secondary">{description}</p>}
      <div className="mt-8">{children}</div>
    </div>
  </main>;
}

export function FormMessage({ error, message }: { error?: string; message?: string }) {
  if (error) return <Notice tone="error">{error}</Notice>;
  if (message) return <Notice>{message}</Notice>;
  return null;
}
