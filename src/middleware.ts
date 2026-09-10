import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip static files, icons and the manifest.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|app-icon|manifest.webmanifest|logos/|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
