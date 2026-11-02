import { NavBar } from "@/components/Shell";
import { ButtonLink, EmptyState } from "@/components/ui";
import { getOwners, getPart, getPartSales, getVehicles, getViewerRole } from "@/lib/data";
import { backFor } from "@/lib/return-to";
import { PartDetail } from "./PartDetail";

export default async function PartPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ added?: string; photos?: string; from?: string }>;
}) {
  const [{ id }, { added, photos, from }] = await Promise.all([params, searchParams]);
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
  // Sales history carries money, so only owners receive it. Only owners can delete.
  const owner = role === "owner";
  const [sales, owners] = owner ? await Promise.all([getPartSales(id), getOwners()]) : [null, null];
  const notice = !added ? "" : photos === "failed" ? "Part added, but some photos didn't upload" : "Part added";
  return <PartDetail part={part} vehicles={vehicles} sales={sales} owners={owners} canDelete={owner} back={back} notice={notice} />;
}
