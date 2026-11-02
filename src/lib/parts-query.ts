import { isUuid } from "./ids";

// The parts list is searched, filtered and paged in the database
// (search_parts). This keeps what the browser asks for to known values.

export const PARTS_PAGE = 48;

export type PartsQuery = { q: string; car: string; status: string; sort: "recent" | "name" };

const STATUSES = ["", "in_stock", "reserved"];

export function partsQuery(raw: { q?: unknown; car?: unknown; status?: unknown; sort?: unknown }): PartsQuery {
  const text = (value: unknown) => (typeof value === "string" ? value : "");
  const car = text(raw.car);
  const status = text(raw.status);
  return {
    q: text(raw.q).trim().slice(0, 100),
    car: car === "none" || isUuid(car) ? car : "",
    status: STATUSES.includes(status) ? status : "",
    sort: raw.sort === "name" ? "name" : "recent",
  };
}

/** The URL for a view of the parts list; defaults are left out to keep it short. */
export function partsUrl(query: PartsQuery) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.car) params.set("car", query.car);
  if (query.status) params.set("status", query.status);
  if (query.sort !== "recent") params.set("sort", query.sort);
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}
