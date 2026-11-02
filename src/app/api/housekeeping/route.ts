import { NextResponse, type NextRequest } from "next/server";
import { purgeExpiredItems } from "@/lib/actions";

// Background clean-up of Recently deleted. A plain request rather than a server
// action, so it never sits in the page's action queue ahead of a real save.
export async function POST(request: NextRequest) {
  // Same check Next.js makes for server actions: the page calling must be this site.
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const origin = request.headers.get("origin");
  if (!origin || !host || new URL(origin).host !== host) return new NextResponse(null, { status: 403 });
  await purgeExpiredItems();
  return new NextResponse(null, { status: 204 });
}
