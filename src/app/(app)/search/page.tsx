import { getVehicles, getViewerRole, searchParts } from "@/lib/data";
import { partsQuery } from "@/lib/parts-query";
import { Inventory } from "./Inventory";

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = partsQuery(await searchParams);
  const [initial, vehicles, role] = await Promise.all([searchParts(query), getVehicles(), getViewerRole()]);
  return <Inventory initial={initial} query={query} vehicles={vehicles} canDelete={role === "owner"} />;
}
