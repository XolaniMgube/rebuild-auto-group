import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { isRemembered, PERSIST_COOKIE, withPersistence } from "@/lib/lock";
import { supabaseEnv } from "./env";
import { supabaseFetch } from "./fetch";

// For Server Components, Server Actions and Route Handlers. Create one
// per request; never share a client between users.
export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = supabaseEnv();
  const remembered = isRemembered(cookieStore.get(PERSIST_COOKIE)?.value);

  return createServerClient<Database>(url, key, {
    global: { fetch: supabaseFetch },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, withPersistence(options, remembered, value))
          );
        } catch {
          // Server Components can't set cookies. Middleware refreshes the session instead.
        }
      },
    },
  });
}
