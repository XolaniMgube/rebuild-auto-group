import { PageHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui";
import { purgeExpiredItems } from "@/lib/actions";
import { getRecentlyDeleted, getViewerRole } from "@/lib/data";
import { RecentlyDeleted } from "./RecentlyDeleted";

export default async function DeletedPage() {
  if ((await getViewerRole()) !== "owner") {
    return <>
      <PageHeader eyebrow="Owners" title="Recently deleted" />
      <main className="page page-bottom pt-5 lg:pt-8">
        <div className="card"><EmptyState icon="lock" title="Owners only" description="Ask an owner if something needs to be restored." /></div>
      </main>
    </>;
  }
  // Anything past its 30 days is removed for good before the list is read.
  await purgeExpiredItems();
  const { projects, parts } = await getRecentlyDeleted();
  return <RecentlyDeleted projects={projects} parts={parts} />;
}
