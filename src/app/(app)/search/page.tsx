"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useStore, searchParts } from "@/lib/store";
import { MobileHeader, PageHead } from "@/components/Shell";
import { Empty, SearchIcon } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { PartRow } from "@/components/PartRow";
import { carName } from "@/lib/format";
import type { Condition } from "@/lib/types";

export default function SearchPage() {
  return <Suspense><Inventory /></Suspense>;
}

function Inventory() {
  const params = useSearchParams();
  const parts = useStore(s => s.parts);
  const vehicles = useStore(s => s.vehicles);
  const [query, setQuery] = useState("");
  const [vehicleId, setVehicleId] = useState(params.get("car") ?? "");
  const [condition, setCondition] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("recent");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterCount = Number(Boolean(condition)) + Number(Boolean(status));
  const results = useMemo(() => searchParts(parts, vehicles, query, {
    condition: (condition || null) as Condition | null,
  }).filter(p => ["IN_STOCK", "RESERVED"].includes(p.status)
    && (!vehicleId || p.vehicleId === vehicleId) && (!status || p.status === status))
    .sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : b.createdAt.localeCompare(a.createdAt)),
  [parts, vehicles, query, condition, vehicleId, status, sort]);
  const clear = () => { setQuery(""); setVehicleId(""); setCondition(""); setStatus(""); };

  return <>
    <MobileHeader title="Parts" />
    <PageHead title="Parts" actions={<Link className="action" href="/add"><Icon name="plus" />Add part</Link>} />
    <main className="workspace !p-0">
      <section className="sticky top-0 z-10 bg-paper p-3 lg:px-8 lg:pt-6 border-b border-hairline">
        <div className="flex items-center gap-3 rounded-xl border border-hairline bg-white pl-3 pr-1">
          <SearchIcon className="w-5 h-5 shrink-0 text-brand-blue" />
          <input aria-label="Search parts" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Part, car or shelf" className="w-full min-w-0 bg-transparent outline-none py-3 text-base" />
          {query && <button aria-label="Clear search" className="h-11 w-11 shrink-0 text-xl" onClick={() => setQuery("")}>×</button>}
        </div>
        <div className="flex gap-2 mt-2">
          <select aria-label="Filter by car" value={vehicleId} onChange={e => setVehicleId(e.target.value)} className="filter flex-1 min-w-0">
            <option value="">All cars</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{carName(v)}</option>)}
          </select>
          <button aria-expanded={filtersOpen} aria-controls="inventory-filters" className={`filter shrink-0 ${filterCount ? "!text-brand-blue !border-brand-blue" : ""}`} onClick={() => setFiltersOpen(!filtersOpen)}>
            Filters{filterCount ? ` (${filterCount})` : ""}
          </button>
        </div>
        {filtersOpen && <div id="inventory-filters" className="grid grid-cols-2 gap-2 mt-2">
          <select aria-label="Filter by condition" value={condition} onChange={e => setCondition(e.target.value)} className="filter">
            <option value="">Any condition</option><option value="GOOD">Good</option><option value="FAIR">Fair</option><option value="SPARES_ONLY">Spares</option>
          </select>
          <select aria-label="Filter by availability" value={status} onChange={e => setStatus(e.target.value)} className="filter">
            <option value="">All availability</option><option value="IN_STOCK">In stock</option><option value="RESERVED">On hold</option>
          </select>
          <select aria-label="Sort parts" className="filter" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="recent">Newest first</option><option value="name">Name: A–Z</option>
          </select>
          <button onClick={clear} className="filter !text-brand-blue">Clear filters</button>
        </div>}
      </section>
      <div className="lg:px-8 lg:pb-8">
        <div className="flex items-center px-4 py-2 text-xs text-slate min-h-10">
          <span aria-live="polite">{results.length} parts</span>
          {(query || vehicleId || filterCount > 0) && <button onClick={clear} className="ml-auto min-h-11 px-2 text-brand-blue">Clear</button>}
        </div>
        <div className="bg-white lg:panel overflow-hidden">
          {results.length ? results.map(part => <PartRow key={part.id} part={part}
            vehicle={vehicles.find(v => v.id === part.vehicleId)} href={`/parts/${part.id}`} />)
            : <Empty title="No matching parts" action={<button className="action" onClick={clear}>Clear filters</button>} />}
        </div>
      </div>
    </main>
  </>;
}
