"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, EmptyState } from "@/components/ui";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  const [retrying, startRetry] = useTransition();

  return <main className="page page-bottom grid min-h-[70dvh] place-items-center">
    <div className="card w-full max-w-md">
      <EmptyState icon="alert" title="Unable to load this page" description="Check your connection and try again."
        action={<Button variant="secondary" loading={retrying} onClick={() => startRetry(() => { router.refresh(); reset(); })}>Try again</Button>} />
    </div>
  </main>;
}
