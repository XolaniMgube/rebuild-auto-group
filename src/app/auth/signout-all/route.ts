import { NextResponse, type NextRequest } from "next/server";
import { PERSIST_COOKIE, UNLOCK_COOKIE } from "@/lib/lock";
import { createClient } from "@/lib/supabase/server";

// Ends the session on every device, for a lost or stolen phone. POST only, so
// link prefetching can never sign someone out.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });

  const response = NextResponse.redirect(new URL("/login?signedout=all", request.url), { status: 303 });
  response.cookies.delete(UNLOCK_COOKIE);
  response.cookies.delete(PERSIST_COOKIE);
  return response;
}
