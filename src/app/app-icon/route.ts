import { renderBrandIcon } from "@/lib/brand-icon";

export const dynamic = "force-static";

export async function GET() {
  return renderBrandIcon(512, "#F5F7FA", 32);
}
