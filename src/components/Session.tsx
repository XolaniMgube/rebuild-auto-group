"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Role, WorkspaceCounts } from "@/lib/types";

export type Session = { id: string; name: string; email: string; role: Role };

const SessionContext = createContext<{ session: Session; counts: WorkspaceCounts | null } | null>(null);

export function SessionProvider({ session, counts, children }: { session: Session; counts: WorkspaceCounts | null; children: ReactNode }) {
  return <SessionContext.Provider value={{ session, counts }}>{children}</SessionContext.Provider>;
}

function useWorkspace() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("Session hooks must be used inside SessionProvider");
  return value;
}

export function useSession(): Session {
  return useWorkspace().session;
}

/** Sidebar counts, or null when they couldn't be loaded. */
export function useCounts(): WorkspaceCounts | null {
  return useWorkspace().counts;
}
