import Link from "next/link";
import { plural, rands } from "@/lib/format";
import type { ProjectSummary } from "@/lib/types";
import { Icon } from "./Icon";

export function ProjectCard({ project }: { project: ProjectSummary }) {
  const { vehicle: v, photo, partCount, tasksDone, tasksTotal, money } = project;
  const details = [v.year, v.color].filter(Boolean).join(" · ");
  const showMoney = money && (money.cost > 0 || money.revenue > 0);
  const profit = money ? money.revenue - money.cost : 0;
  const recovered = money && money.cost > 0 ? Math.min(money.revenue / money.cost, 1) : 1;

  return <Link href={`/cars/${v.id}`} className="card-link p-3 pr-4">
    <div className="flex items-center gap-4">
      {photo
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={photo} alt="" loading="lazy" className="h-20 w-20 shrink-0 rounded-thumb bg-subtle object-cover" />
        : <span aria-hidden="true" className="grid h-20 w-20 shrink-0 place-items-center rounded-thumb bg-subtle text-tertiary"><Icon name="car" className="h-8 w-8" /></span>}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-card">{v.make} {v.model}</h3>
        {details && <p className="mt-0.5 truncate text-meta text-secondary">{details}</p>}
        {v.registration && <p className="mt-2 inline-flex rounded-md border border-line px-1.5 py-0.5 text-caption font-semibold uppercase tracking-wide text-secondary">{v.registration}</p>}
      </div>
      <Icon name="chevron" className="h-4 w-4 shrink-0 text-tertiary" />
    </div>
    {showMoney && <div className="mt-3 rounded-xl bg-subtle px-3 py-2.5 pl-1 sm:pl-3">
      <div className="flex items-center justify-between gap-3 pl-2 text-meta sm:pl-0">
        <span className="truncate text-secondary tabular-nums">Sold {rands(money.revenue)} of {rands(money.cost)}</span>
        <span className={`shrink-0 font-semibold tabular-nums ${profit >= 0 ? "text-success" : "text-ink"}`}>{profit >= 0 ? `+${rands(profit)}` : `${rands(-profit)} to go`}</span>
      </div>
      <div aria-hidden="true" className="ml-2 mt-2 h-1.5 overflow-hidden rounded-full bg-surface sm:ml-0">
        <div className="h-full rounded-full bg-success" style={{ width: `${recovered * 100}%` }} />
      </div>
    </div>}
    <div className="mt-3 flex items-center justify-between gap-3 border-t border-separator pl-1 pt-3 text-meta text-secondary">
      <span className="inline-flex items-center gap-1.5"><Icon name="box" className="h-4 w-4" />{plural(partCount, "part")}</span>
      {tasksTotal > 0 && <span className="inline-flex items-center gap-2 tabular-nums">
        <span aria-hidden="true" className="h-1.5 w-14 overflow-hidden rounded-full bg-subtle"><span className="block h-full rounded-full bg-brand-navy" style={{ width: `${(tasksDone / tasksTotal) * 100}%` }} /></span>
        {tasksDone}/{tasksTotal} tasks
      </span>}
    </div>
  </Link>;
}
