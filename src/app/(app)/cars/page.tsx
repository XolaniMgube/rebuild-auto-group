import { getProjectSummaries, getViewerRole } from "@/lib/data";
import { ProjectList } from "./ProjectList";

export default async function CarsPage() {
  const role = await getViewerRole();
  return <ProjectList projects={await getProjectSummaries(role === "owner")} />;
}
