import { NavBar } from "@/components/Shell";
import { ButtonLink, EmptyState } from "@/components/ui";
import { getActiveParts, getProjectMoney, getTasks, getVehicle, getVehicleDocuments, getViewerRole } from "@/lib/data";
import { plural } from "@/lib/format";
import { ProjectDetail } from "./ProjectDetail";

export default async function CarPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ files?: string; added?: string }>;
}) {
  const [{ id }, { files, added }] = await Promise.all([params, searchParams]);
  const [found, parts, tasks, documents, role] = await Promise.all([
    getVehicle(id), getActiveParts(id), getTasks(id), getVehicleDocuments(id), getViewerRole(),
  ]);

  if (!found) {
    return <>
      <NavBar back={{ href: "/cars", label: "Projects" }} />
      <main className="page page-bottom pt-6">
        <div className="card"><EmptyState icon="car" title="Project not found" description="It may have been removed." action={<ButtonLink href="/cars" variant="secondary">Back to projects</ButtonLink>} /></div>
      </main>
    </>;
  }

  // Money is for owners; staff never receive the figures.
  const money = role === "owner" ? await getProjectMoney(id) : null;
  const addedCount = Number(added);
  const notice = files === "failed" ? "Project created, but some files didn't upload"
    : Number.isInteger(addedCount) && addedCount > 0 ? `${plural(addedCount, "part")} added` : "";

  return <ProjectDetail vehicle={found.vehicle} photo={found.photo} documents={documents} parts={parts} tasks={tasks} money={money} notice={notice} />;
}
