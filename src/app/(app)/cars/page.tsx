import { getProjectSummaries } from "@/lib/data";
import { ProjectList } from "./ProjectList";

export default async function CarsPage() {
  return <ProjectList projects={await getProjectSummaries()} />;
}
