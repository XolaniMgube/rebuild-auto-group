"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PartCard } from "@/components/PartCard";
import { PageHeader } from "@/components/Shell";
import { Button, ButtonLink, EmptyState, Field, FilterButton, FilterTiles, Notice, SearchBar, SectionHeading, Select, Sheet } from "@/components/ui";
import { carName, plural } from "@/lib/format";
import { CONDITION_OPTIONS, type Part, type Vehicle } from "@/lib/types";

const STATUS_TITLE: Record<string, string> = { "": "All parts", in_stock: "In stock", reserved: "On hold" };

export function Inventory({ parts, vehicles }: { parts: Part[]; vehicles: Vehicle[] }) {
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [vehicleId, setVehicleId] = useState(params.get("car") ?? "");
  const [condition, setCondition] = useState("");
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [sort, setSort] = useState("recent");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [binned, setBinned] = useState(params.get("binned") === "part");
  const filterCount = Number(Boolean(condition)) + Number(Boolean(vehicleId)) + Number(sort !== "recent");
  const filtering = Boolean(query || vehicleId || condition || status || sort !== "recent");
  const byId = useMemo(() => new Map(vehicles.map(v => [v.id, v])), [vehicles]);
  const results = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return parts.filter(p => (!vehicleId || p.vehicleId === vehicleId) && (!condition || p.condition === condition)
      && (!status || p.status === status) && matches(p, p.vehicleId ? byId.get(p.vehicleId) : undefined, terms))
      .sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : b.createdAt.localeCompare(a.createdAt));
  }, [parts, byId, query, condition, vehicleId, status, sort]);
  const clear = () => { setQuery(""); setVehicleId(""); setCondition(""); setStatus(""); setSort("recent"); };

  // Links such as /search?car=… and /search?status=… (from the sidebar) set the filters.
  useEffect(() => {
    setVehicleId(params.get("car") ?? "");
    setStatus(params.get("status") ?? "");
  }, [params]);

  const carSelect = <Select aria-label="Car project" value={vehicleId} onChange={e => setVehicleId(e.target.value)}>
    <option value="">All cars</option>
    {vehicles.map(v => <option key={v.id} value={v.id}>{carName(v)}</option>)}
  </Select>;
  const conditionSelect = <Select aria-label="Condition" value={condition} onChange={e => setCondition(e.target.value)}>
    <option value="">Any condition</option>
    {CONDITION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </Select>;
  const sortSelect = <Select aria-label="Sort by" value={sort} onChange={e => setSort(e.target.value)}>
    <option value="recent">Newest first</option>
    <option value="name">Name: A–Z</option>
  </Select>;

  return <>
    <PageHeader eyebrow="Inventory" title="Parts" description="Search every part by name, car or shelf." />

    <div className="bar-canvas sticky top-0 z-20" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="page flex gap-2.5 py-3">
        <SearchBar label="Search parts" placeholder="Part, car or shelf" value={query} onChange={setQuery} />
        <div className="hidden gap-2.5 lg:flex [&_select]:min-h-14">
          <div className="w-52">{carSelect}</div>
          <div className="w-44">{conditionSelect}</div>
          <div className="w-44">{sortSelect}</div>
        </div>
        <FilterButton className="lg:hidden" count={filterCount} onClick={() => setFiltersOpen(true)} />
      </div>
    </div>

    <main className="page page-bottom space-y-6 pt-2">
      {binned && <Notice onDismiss={() => setBinned(false)}>
        Part moved to Recently deleted. <Link href="/deleted" className="font-semibold underline underline-offset-2">View</Link>
      </Notice>}
      <FilterTiles label="Availability" value={status} onChange={setStatus} options={[
        { value: "", label: "All parts", count: parts.length, tone: "navy" },
        { value: "in_stock", label: "In stock", count: parts.filter(p => p.status === "in_stock").length, tone: "success" },
        { value: "reserved", label: "On hold", count: parts.filter(p => p.status === "reserved").length, tone: "warning" },
      ]} />

      <section>
        <SectionHeading title={STATUS_TITLE[status] ?? "Parts"} action={<div className="flex items-center gap-1 text-meta text-secondary">
          <span role="status">{plural(results.length, "part")}{vehicleId && ` · ${byId.get(vehicleId)?.model ?? "Project"}`}</span>
          {filtering && <button type="button" onClick={clear} className="-mr-1 ml-1 min-h-10 rounded-lg px-2 font-semibold text-brand-navy transition hover:bg-brand-navy-tint">Reset</button>}
        </div>} />
        {results.length
          ? <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
            {results.map(part => <PartCard key={part.id} part={part} vehicle={part.vehicleId ? byId.get(part.vehicleId) : null} />)}
          </div>
          : <div className="card">
            {parts.length
              ? <EmptyState icon="search" title="No matching parts" description="Try another search or clear the filters." action={<Button variant="secondary" onClick={clear}>Clear filters</Button>} />
              : <EmptyState icon="box" title="No parts yet" description="Parts you add will appear here." action={<ButtonLink href="/add">Add your first part</ButtonLink>} />}
          </div>}
      </section>
    </main>

    <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters"
      footer={<>
        <Button variant="secondary" block className="sm:w-auto" onClick={clear}>Reset</Button>
        <Button block className="sm:w-auto" onClick={() => setFiltersOpen(false)}>Show {plural(results.length, "part")}</Button>
      </>}>
      <div className="space-y-4">
        <Field label="Car project">{carSelect}</Field>
        <Field label="Condition">{conditionSelect}</Field>
        <Field label="Sort by">{sortSelect}</Field>
      </div>
    </Sheet>
  </>;
}

function matches(part: Part, vehicle: Vehicle | undefined, terms: string[]) {
  if (!terms.length) return true;
  const haystack = [part.name, part.brand, part.serialNumber, part.location, part.description, vehicle && carName(vehicle)]
    .filter(Boolean).join(" ").toLowerCase();
  return terms.every(term => haystack.includes(term));
}
