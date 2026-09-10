import { getActiveParts, getVehicles } from "@/lib/data";
import { Inventory } from "./Inventory";

export default async function SearchPage() {
  const [parts, vehicles] = await Promise.all([getActiveParts(), getVehicles()]);
  return <Inventory parts={parts} vehicles={vehicles} />;
}
