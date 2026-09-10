import { NavBar } from "@/components/Shell";
import { ButtonLink, EmptyState } from "@/components/ui";
import { getActiveParts, getTasks, getVehicle, getVehicleDocuments } from "@/lib/data";
import { ProjectDetail } from "./ProjectDetail";

export default async function CarPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ files?: string }>;
}) {
  const [{ id }, { files }] = await Promise.all([params, searchParams]);
  const [found, parts, tasks, documents] = await Promise.all([getVehicle(id), getActiveParts(id), getTasks(id), getVehicleDocuments(id)]);

  if (!found) {
    return <>
      <NavBar back={{ href: "/cars", label: "Projects" }} />
      <main className="page page-bottom pt-6">
        <div className="card"><EmptyState icon="car" title="Project not found" description="It may have been removed." action={<ButtonLink href="/cars" variant="secondary">Back to projects</ButtonLink>} /></div>
      </main>
    </>;
  }
  const notice = files === "failed" ? "Project created, but some files didn't upload" : "";
  return <ProjectDetail vehicle={found.vehicle} photo={found.photo} documents={documents} parts={parts} tasks={tasks} notice={notice} />;
}
