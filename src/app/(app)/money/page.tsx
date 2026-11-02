import { notFound } from "next/navigation";
import { PageHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui";
import { getMoneyOverview, getViewerRole } from "@/lib/data";
import { MONEY_PAGE } from "@/lib/features";
import { todayIso } from "@/lib/format";
import { isPeriod, summarise } from "@/lib/money";
import { MoneyOverview } from "./MoneyOverview";

/** The business's money across every car: owners only. */
export default async function MoneyPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  if (!MONEY_PAGE) notFound(); // paused: no database requests
  if ((await getViewerRole()) !== "owner") {
    return <>
      <PageHeader eyebrow="Owners" title="Money" />
      <main className="page page-bottom pt-2">
        <div className="card"><EmptyState icon="lock" title="Owners only" description="Ask an owner about the figures." /></div>
      </main>
    </>;
  }
  const { period: raw } = await searchParams;
  const period = isPeriod(raw) ? raw : "month";
  const data = await getMoneyOverview();
  return <MoneyOverview period={period} summary={summarise(data, period, todayIso())} owners={data.owners} transfers={data.transfers} />;
}
