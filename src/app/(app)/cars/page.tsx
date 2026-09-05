"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { MobileHeader, PageHead } from "@/components/Shell";
import { Empty } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { carName } from "@/lib/format";

export default function CarsPage() {
  const vehicles = useStore(s => s.vehicles);
  const parts = useStore(s => s.parts);
  const tasks = useStore(s => s.tasks);
  const [query, setQuery] = useState("");
  const results = vehicles.filter(v => carName(v).toLowerCase().includes(query.toLowerCase()));

  return <>
    <MobileHeader title="Projects" />
    <PageHead title="Projects" actions={<Link href="/cars/new" className="action"><Icon name="plus" />New project</Link>} />
    <main className="workspace !p-3 lg:!p-8 space-y-3">
      <div className="flex gap-2">
        <input aria-label="Search car projects" className="filter min-w-0 flex-1" placeholder="Search cars" value={query} onChange={e => setQuery(e.target.value)} />
        <Link href="/cars/new" className="action shrink-0 lg:hidden"><Icon name="plus" />New</Link>
      </div>
      <div className="panel overflow-hidden">
        {results.map(v => {
          const own = parts.filter(p => p.vehicleId === v.id && ["IN_STOCK", "RESERVED"].includes(p.status));
          const todo = tasks.filter(t => t.vehicleId === v.id);
          return <Link key={v.id} href={`/cars/${v.id}`} className="flex items-center gap-3 p-4 border-b last:border-b-0 border-hairline hover:bg-paper">
            <span className="grid place-items-center h-12 w-12 shrink-0 rounded-xl bg-brand-blueTint text-brand-blue"><Icon name="car" className="h-6 w-6" /></span>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-base">{carName(v)}</h2>
              {(v.color || v.registration) && <p className="text-xs text-slate mt-1">{[v.color, v.registration].filter(Boolean).join(" · ")}</p>}
              <p className="text-xs text-slate mt-2">{own.length} parts{todo.length > 0 && ` · ${todo.filter(t => t.done).length}/${todo.length} tasks done`}</p>
            </div>
            <Icon name="arrow" className="w-4 h-4 text-brand-blue shrink-0" />
          </Link>;
        })}
        {!results.length && <Empty title={query ? "No matching cars" : "No projects yet"} action={!query && <Link href="/cars/new" className="action">New project</Link>} />}
      </div>
    </main>
  </>;
}
