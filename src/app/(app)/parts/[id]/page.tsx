import { NavBar } from "@/components/Shell";
import { ButtonLink, EmptyState } from "@/components/ui";
import { getPart, getPartSales, getVehicles, getViewerRole } from "@/lib/data";
import { PartDetail } from "./PartDetail";

export default async function PartPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ added?: string; photos?: string }>;
}) {
  const [{ id }, { added, photos }] = await Promise.all([params, searchParams]);
  const [part, vehicles, role] = await Promise.all([getPart(id), getVehicles(), getViewerRole()]);

  if (!part) {
    return <>
      <NavBar back={{ href: "/search", label: "Parts" }} />
      <main className="page page-bottom pt-6">
        <div className="card"><EmptyState icon="box" title="Part not found" description="It may have been sold or deleted." action={<ButtonLink href="/search" variant="secondary">Back to parts</ButtonLink>} /></div>
      </main>
    </>;
  }
  // Sales history carries money, so only owners receive it. Only owners can delete.
  const owner = role === "owner";
  const sales = owner ? await getPartSales(id) : null;
  const notice = !added ? "" : photos === "failed" ? "Part added, but some photos didn't upload" : "Part added";
  return <PartDetail part={part} vehicles={vehicles} sales={sales} canDelete={owner} notice={notice} />;
}
