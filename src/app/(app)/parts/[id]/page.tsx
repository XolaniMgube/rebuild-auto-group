import { NavBar } from "@/components/Shell";
import { ButtonLink, EmptyState } from "@/components/ui";
import { getOwners, getPart, getPartMoney, getPartSales, getVehicles, getViewerRole } from "@/lib/data";
import { backFor } from "@/lib/return-to";
import { PartDetail } from "./PartDetail";

export default async function PartPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ added?: string; photos?: string; bought?: string; from?: string }>;
}) {
  const [{ id }, { added, photos, bought, from }] = await Promise.all([params, searchParams]);
  const [part, vehicles, role] = await Promise.all([getPart(id), getVehicles(), getViewerRole()]);
  const back = backFor(from, vehicles);

  if (!part) {
    return <>
      <NavBar back={back} />
      <main className="page page-bottom pt-6">
        <div className="card"><EmptyState icon="box" title="Part not found" description="It may have been sold or deleted." action={<ButtonLink href={back.href} variant="secondary">Go back</ButtonLink>} /></div>
      </main>
    </>;
  }
  // Sales history and costs carry money, so only owners receive them. Only owners can delete.
  const owner = role === "owner";
  const [sales, owners, money] = owner ? await Promise.all([getPartSales(id), getOwners(), getPartMoney(id)]) : [null, null, null];
  const notice = !added ? ""
    : photos === "failed" ? "Part added, but some photos didn't upload"
    : bought === "failed" ? "Part added, but what you bought it for didn't save. Add it under Cost."
    : "Part added";
  return <PartDetail part={part} vehicles={vehicles} sales={sales} money={money} owners={owners} canDelete={owner} back={back} notice={notice} />;
}
