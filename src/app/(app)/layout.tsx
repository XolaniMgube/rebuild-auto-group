"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { BottomNav, Sidebar } from "@/components/Shell";

// Demo-grade gate: client-side only. Real auth verifies the Supabase
// session server-side in each route handler before any data moves.

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const signedIn = useStore((s) => s.currentUserId !== null);

  useEffect(() => {
    if (!signedIn) router.replace("/login");
  }, [signedIn, router]);

  if (!signedIn) return null;

  return (
    <div className="flex h-dvh overflow-hidden bg-paper">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
        <BottomNav />
      </div>
    </div>
  );
}
