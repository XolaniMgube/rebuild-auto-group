import { safeNext } from "./safe-redirect";
import type { Vehicle } from "./types";

// A part has one address, /parts/<id>, wherever it was opened from. The screen
// that opened it rides along as ?from=, so the back button returns there:
// "← Toyota RunX" from a project, "← Parts" (filters kept) from the parts list.

export function partHref(partId: string, from?: string) {
  return from ? `/parts/${partId}?from=${encodeURIComponent(from)}` : `/parts/${partId}`;
}

/** Only screens that list parts are honoured; anything else falls back to Parts. */
export function backFor(from: unknown, vehicles: Vehicle[]): { href: string; label: string } {
  const href = safeNext(from, "/search");
  const carId = href.match(/^\/cars\/([0-9a-f-]{36})(?:[?#]|$)/)?.[1];
  if (carId) {
    const vehicle = vehicles.find((v) => v.id === carId);
    return { href, label: vehicle ? `${vehicle.make} ${vehicle.model}` : "Project" };
  }
  if (href === "/search" || href.startsWith("/search?")) return { href, label: "Parts" };
  return { href: "/search", label: "Parts" };
}

export function withParam(href: string, key: string, value: string) {
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set(key, value);
  return `${path}?${params}`;
}
