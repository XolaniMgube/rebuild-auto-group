import { getVehicles, getViewerRole } from "@/lib/data";
import { AddPartForm } from "./AddPartForm";

export default async function AddPartPage({ searchParams }: { searchParams: Promise<{ car?: string }> }) {
  const [{ car }, vehicles, role] = await Promise.all([searchParams, getVehicles(), getViewerRole()]);
  // Only owners record what a part was bought for.
  return <AddPartForm vehicles={vehicles} canRecordCost={role === "owner"} initialCar={car ?? null} />;
}
