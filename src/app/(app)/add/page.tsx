import { getVehicles } from "@/lib/data";
import { AddPartForm } from "./AddPartForm";

export default async function AddPartPage({ searchParams }: { searchParams: Promise<{ car?: string }> }) {
  const [{ car }, vehicles] = await Promise.all([searchParams, getVehicles()]);
  return <AddPartForm vehicles={vehicles} initialCar={car ?? null} />;
}
