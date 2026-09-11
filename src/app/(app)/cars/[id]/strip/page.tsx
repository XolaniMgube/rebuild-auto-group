import { NavBar } from "@/components/Shell";
import { ButtonLink, EmptyState } from "@/components/ui";
import { getVehicle, getVehiclePartNames } from "@/lib/data";
import { StripPicker } from "./StripPicker";

export default async function StripPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ files?: string }>;
}) {
  const [{ id }, { files }] = await Promise.all([params, searchParams]);
  const [found, existing] = await Promise.all([getVehicle(id), getVehiclePartNames(id)]);

  if (!found) {
    return <>
      <NavBar back={{ href: "/cars", label: "Projects" }} />
      <main className="page page-bottom pt-6">
        <div className="card"><EmptyState icon="car" title="Project not found" description="It may have been removed." action={<ButtonLink href="/cars" variant="secondary">Back to projects</ButtonLink>} /></div>
      </main>
    </>;
  }
  const notice = files === "failed" ? "Project created, but some files didn't upload" : "";
  return <StripPicker vehicle={found.vehicle} existing={existing} notice={notice} />;
}
