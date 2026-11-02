"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { ProjectCard } from "@/components/ProjectCard";
import { PageHeader } from "@/components/Shell";
import { ButtonLink, EmptyState, IconLink, Notice, SearchBar, SectionHeading, StatTiles } from "@/components/ui";
import { carName, plural } from "@/lib/format";
import type { ProjectSummary } from "@/lib/types";

export function ProjectList({ projects }: { projects: ProjectSummary[] }) {
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [binned, setBinned] = useState(params.get("binned") === "project");
  const results = projects.filter(({ vehicle }) => carName(vehicle).toLowerCase().includes(query.trim().toLowerCase()));
  const partsOnCars = projects.reduce((sum, p) => sum + p.partCount, 0);
  const openTasks = projects.reduce((sum, p) => sum + (p.tasksTotal - p.tasksDone), 0);

  return <>
    <PageHeader eyebrow="Workshop" title="Projects" description="Cars you're stripping or rebuilding, with their parts and checklists."
      actions={<ButtonLink href="/cars/new"><Icon name="plus" strokeWidth={2.2} />New project</ButtonLink>} />

    <div className="bar-canvas sticky top-0 z-20" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="page flex gap-2.5 py-3">
        <SearchBar label="Search car projects" placeholder="Make, model or year" value={query} onChange={setQuery} />
        <IconLink href="/cars/new" label="New project" icon="plus" variant="dark" size="lg" className="lg:hidden" />
      </div>
    </div>

    <main className="page page-bottom space-y-6 pt-2">
      {binned && <Notice onDismiss={() => setBinned(false)}>
        Project moved to Recently deleted. <Link href="/deleted" className="font-semibold underline underline-offset-2">View</Link>
      </Notice>}
      <StatTiles items={[
        { label: "Projects", value: projects.length, tone: "navy", icon: "car" },
        { label: "Parts", value: partsOnCars, tone: "success", icon: "box" },
        { label: "Open tasks", value: openTasks, tone: "warning", icon: "checklist" },
      ]} />

      <section>
        <SectionHeading title={query ? "Results" : "All projects"} note={plural(results.length, "project")} />
        {results.length
          ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{results.map(project => <ProjectCard key={project.vehicle.id} project={project} />)}</div>
          : <div className="card">
            {query
              ? <EmptyState icon="search" title="No matching projects" description="Try a different make, model or year." />
              : <EmptyState icon="car" title="No projects yet" description="Car projects you create will appear here." action={<ButtonLink href="/cars/new">Create a project</ButtonLink>} />}
          </div>}
      </section>
    </main>
  </>;
}
