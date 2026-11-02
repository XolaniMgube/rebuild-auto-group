import { NextResponse, type NextRequest } from "next/server";
import { UNLOCK_COOKIE } from "@/lib/lock";
import { createClient } from "@/lib/supabase/server";

// POST only, so link prefetching can never sign someone out.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const response = NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  response.cookies.delete(UNLOCK_COOKIE);
  return response;
}
