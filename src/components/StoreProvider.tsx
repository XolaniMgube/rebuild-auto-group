"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { GearMark } from "./Logo";

// The store persists to localStorage, which the server can't see.
// Rehydrating on mount rather than during render keeps the server
// and client markup identical and avoids hydration errors.

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    useStore.persist.rehydrate();
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-dvh grid place-items-center bg-paper">
        <GearMark className="h-12 w-12 opacity-30" />
      </div>
    );
  }

  return <>{children}</>;
}
