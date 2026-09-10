import { NavBar } from "@/components/Shell";
import { ButtonLink, EmptyState } from "@/components/ui";
import { getPart, getVehicles } from "@/lib/data";
import { PartDetail } from "./PartDetail";

export default async function PartPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ added?: string; photos?: string }>;
}) {
  const [{ id }, { added, photos }] = await Promise.all([params, searchParams]);
  const [part, vehicles] = await Promise.all([getPart(id), getVehicles()]);

  if (!part) {
    return <>
      <NavBar back={{ href: "/search", label: "Parts" }} />
      <main className="page page-bottom pt-6">
        <div className="card"><EmptyState icon="box" title="Part not found" description="It may have been sold or removed." action={<ButtonLink href="/search" variant="secondary">Back to parts</ButtonLink>} /></div>
      </main>
    </>;
  }
  const notice = !added ? "" : photos === "failed" ? "Part added, but some photos didn't upload" : "Part added";
  return <PartDetail part={part} vehicles={vehicles} notice={notice} />;
}
