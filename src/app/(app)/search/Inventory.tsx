"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BulkDeleteBar, useSelection } from "@/components/BulkDelete";
import { Icon } from "@/components/Icon";
import { PartCard } from "@/components/PartCard";
import { PageHeader } from "@/components/Shell";
import { Button, ButtonLink, EmptyState, Field, FilterButton, FilterTiles, IconButton, InlineError, Notice, SearchBar, SectionHeading, Select, Sheet, Spinner } from "@/components/ui";
import { carName, plural } from "@/lib/format";
import { partsUrl, type PartsQuery } from "@/lib/parts-query";
import type { PartsPage, Vehicle } from "@/lib/types";
import { moreParts } from "./actions";

const STATUS_TITLE: Record<string, string> = { "": "All parts", in_stock: "In stock", reserved: "On hold" };
const UNASSIGNED = "none"; // the "car" filter value for parts on no project
const VIEW_KEY = "rag:parts-view";
type View = "grid" | "list";

// Remembered per browser; storage can be blocked, so every access is guarded.
function savedView(): View {
  try { return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid"; } catch { return "grid"; }
}

/**
 * The parts list. Search, filters and sort live in the URL and run in the
 * database; this shows one page at a time and fetches more on request.
 */
export function Inventory({ initial, query, vehicles, canDelete }: { initial: PartsPage; query: PartsQuery; vehicles: Vehicle[]; canDelete: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const selection = useSelection();
  const [items, setItems] = useState(initial.parts);
  const [text, setText] = useState(query.q);
  const [car, setCar] = useState(query.car);
  const [status, setStatus] = useState(query.status);
  const [sort, setSort] = useState(query.sort);
  const pushedText = useRef(query.q);
  const [loading, startLoading] = useTransition();
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [view, setView] = useState<View>("grid");
  const [message, setMessage] = useState(params.get("binned") === "part" ? "Part moved to Recently deleted" : "");
  const byId = new Map(vehicles.map(v => [v.id, v]));
  const filtering = Boolean(query.q || query.car || query.status || query.sort !== "recent");
  const filterCount = Number(Boolean(query.car)) + Number(query.sort !== "recent");
  const selected = items.filter(part => selection.ids.has(part.id));
  const returnTo = partsUrl(query);

  // A fresh first page arrives whenever the filters change or something is saved.
  useEffect(() => { setItems(initial.parts); setMoreError(null); }, [initial]);

  // Follow changes made elsewhere, such as the sidebar filters or the back button.
  useEffect(() => {
    setCar(query.car);
    setStatus(query.status);
    setSort(query.sort);
    if (query.q !== pushedText.current) {
      pushedText.current = query.q;
      setText(query.q);
    }
  }, [query.q, query.car, query.status, query.sort]);

  useEffect(() => setView(savedView()), []);

  function go(next: Partial<PartsQuery>) {
    startLoading(() => router.replace(partsUrl({ ...query, ...next }), { scroll: false }));
  }

  // Typing searches after a short pause, not on every key.
  useEffect(() => {
    const value = text.trim();
    if (value === pushedText.current) return;
    const timer = setTimeout(() => {
      pushedText.current = value;
      go({ q: value });
    }, 300);
    return () => clearTimeout(timer);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  function chooseView(next: View) {
    setView(next);
    try { localStorage.setItem(VIEW_KEY, next); } catch { /* the choice just won't be remembered */ }
  }

  function clear() {
    setText("");
    pushedText.current = "";
    go({ q: "", car: "", status: "", sort: "recent" });
  }

  function stopSelecting() {
    setSelecting(false);
    selection.clear();
  }

  async function showMore() {
    setLoadingMore(true);
    setMoreError(null);
    const result = await moreParts(query, items.length);
    setLoadingMore(false);
    if ("error" in result) setMoreError(result.error);
    else setItems(prev => [...prev, ...result.parts.filter(part => !prev.some(p => p.id === part.id))]);
  }

  const carSelect = <Select aria-label="Car project" icon="car" value={car} onChange={e => { setCar(e.target.value); go({ car: e.target.value }); }}>
    <option value="">All cars</option>
    <option value={UNASSIGNED}>Unassigned</option>
    {vehicles.map(v => <option key={v.id} value={v.id}>{carName(v)}</option>)}
  </Select>;
  const sortSelect = <Select aria-label="Sort by" icon="sort" value={sort} onChange={e => { const value = e.target.value === "name" ? "name" : "recent"; setSort(value); go({ sort: value }); }}>
    <option value="recent">Newest first</option>
    <option value="name">Name: A–Z</option>
  </Select>;
  const scope = query.car === UNASSIGNED ? " · Unassigned" : query.car ? ` · ${byId.get(query.car)?.model ?? "Project"}` : "";

  return <>
    <PageHeader eyebrow="Inventory" title="Parts" description="Manage and find your vehicle parts in one place."
      actions={<ButtonLink href="/add"><Icon name="plus" strokeWidth={2.2} />Add part</ButtonLink>} />

    <div className="bar-canvas sticky top-0 z-20" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="page flex gap-2.5 py-3">
        <SearchBar label="Search parts" placeholder="Search parts, cars or shelves…" value={text} onChange={setText} />
        <div className="hidden gap-2.5 lg:flex [&_select]:min-h-14">
          <div className="w-56">{carSelect}</div>
          <div className="w-52">{sortSelect}</div>
          <div role="group" aria-label="Layout" className="flex gap-1.5">
            <IconButton label="Grid view" icon="grid" size="lg" variant={view === "grid" ? "dark" : "surface"} aria-pressed={view === "grid"} onClick={() => chooseView("grid")} />
            <IconButton label="List view" icon="list" size="lg" variant={view === "list" ? "dark" : "surface"} aria-pressed={view === "list"} onClick={() => chooseView("list")} />
          </div>
        </div>
        <FilterButton className="lg:hidden" count={filterCount} onClick={() => setFiltersOpen(true)} />
      </div>
    </div>

    <main className={`page page-bottom space-y-6 pt-2 ${selecting ? "pb-40 lg:pb-32" : ""}`}>
      {message && <Notice onDismiss={() => setMessage("")}>
        {message}. <Link href="/deleted" className="font-semibold underline underline-offset-2">View</Link>
      </Notice>}
      <FilterTiles label="Availability" value={status} onChange={value => { setStatus(value); go({ status: value }); }} options={[
        { value: "", label: "All parts", count: initial.counts.all, tone: "navy", icon: "box" },
        { value: "in_stock", label: "In stock", count: initial.counts.inStock, tone: "success", icon: "boxes" },
        { value: "reserved", label: "On hold", count: initial.counts.onHold, tone: "warning", icon: "clock" },
      ]} />

      <section aria-busy={loading}>
        <SectionHeading title={STATUS_TITLE[query.status] ?? "Parts"}
          note={<span role="status" className="inline-flex items-center gap-2">{plural(initial.total, "item")}{scope}{loading && <Spinner className="h-3.5 w-3.5" />}</span>}
          action={selecting
            ? <button type="button" onClick={stopSelecting} className="min-h-10 rounded-lg px-2 text-[15px] font-semibold text-brand-navy transition hover:bg-brand-navy-tint">Cancel</button>
            : <div className="flex items-center gap-1 text-meta">
              {filtering && <button type="button" onClick={clear} className="min-h-10 rounded-lg px-2 font-semibold text-brand-navy transition hover:bg-brand-navy-tint">Reset</button>}
              {canDelete && items.length > 0 && <button type="button" onClick={() => setSelecting(true)}
                className="-mr-1 inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-[15px] font-semibold text-brand-navy transition hover:bg-brand-navy-tint">
                <Icon name="check-circle" className="h-4 w-4" />Select
              </button>}
            </div>} />
        {items.length
          ? <div className={`transition-opacity duration-fast ${loading ? "opacity-60" : ""}`}>
            <div className={view === "list" ? "space-y-2" : "grid gap-3 lg:grid-cols-2 2xl:grid-cols-3"}>
              {items.map(part => <PartCard key={part.id} part={part} vehicle={part.vehicleId ? byId.get(part.vehicleId) : null} from={returnTo}
                layout={view === "list" ? "row" : "card"} selectable={selecting} selected={selection.ids.has(part.id)} onSelect={selection.toggle} />)}
            </div>
            {items.length < initial.total && <div className="mt-5 flex flex-col items-center gap-2">
              <p className="text-meta text-secondary">Showing {items.length} of {initial.total}</p>
              <Button variant="secondary" loading={loadingMore} onClick={showMore}>Show more</Button>
              {moreError && <InlineError>{moreError}</InlineError>}
            </div>}
          </div>
          : <div className="card">
            {filtering || initial.counts.all > 0
              ? <EmptyState icon="search" title="No matching parts" description="Try another search or clear the filters." action={<Button variant="secondary" onClick={clear}>Clear filters</Button>} />
              : <EmptyState icon="box" title="No parts yet" description="Parts you add will appear here." action={<ButtonLink href="/add">Add your first part</ButtonLink>} />}
          </div>}
      </section>
    </main>

    {selecting && <BulkDeleteBar parts={selected} allSelected={selected.length === items.length && items.length > 0}
      onSelectAll={() => selection.set(items.map(part => part.id))} onClear={selection.clear}
      onDeleted={text => { stopSelecting(); setMessage(text); }} />}

    <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters"
      footer={<>
        <Button variant="secondary" block className="sm:w-auto" onClick={clear}>Reset</Button>
        <Button block className="sm:w-auto" onClick={() => setFiltersOpen(false)}>Show {plural(initial.total, "part")}</Button>
      </>}>
      <div className="space-y-4">
        <Field label="Car project">{carSelect}</Field>
        <Field label="Sort by">{sortSelect}</Field>
      </div>
    </Sheet>
  </>;
}
