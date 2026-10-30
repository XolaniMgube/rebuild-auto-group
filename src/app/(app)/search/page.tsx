import { getActiveParts, getVehicles, getViewerRole } from "@/lib/data";
import { Inventory } from "./Inventory";

export default async function SearchPage() {
  const [parts, vehicles, role] = await Promise.all([getActiveParts(), getVehicles(), getViewerRole()]);
  return <Inventory parts={parts} vehicles={vehicles} canDelete={role === "owner"} />;
}
