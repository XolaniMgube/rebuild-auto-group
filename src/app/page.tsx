"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const signedIn = useStore((s) => s.currentUserId !== null);

  useEffect(() => {
    router.replace(signedIn ? "/search" : "/login");
  }, [signedIn, router]);

  return null;
}
