import { Skeleton } from "./ui";

// Placeholders that match the real layouts, so nothing jumps when data arrives.

function NavBarSkeleton() {
  return <div className="border-b border-line/60 bg-surface/80" style={{ paddingTop: "env(safe-area-inset-top)" }}>
    <div className="page flex h-14 items-center"><Skeleton className="h-5 w-20" /></div>
  </div>;
}

function RowSkeleton() {
  return <div className="card flex items-center gap-4 p-3">
    <Skeleton className="h-20 w-20 rounded-thumb" />
    <div className="flex-1 space-y-2.5">
      <Skeleton className="h-4 w-3/5" />
      <Skeleton className="h-3 w-2/5" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  </div>;
}

export function ListPageSkeleton() {
  return <div role="status" aria-busy="true" aria-label="Loading">
    <div className="border-b border-line/70 bg-surface" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="page pb-5 pt-2 lg:pb-8 lg:pt-10">
        <div className="flex h-12 items-center justify-between lg:hidden"><Skeleton className="h-6 w-20" /><Skeleton className="h-9 w-9 rounded-full" /></div>
        <div className="mt-3 space-y-2.5 lg:mt-0">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-40 rounded-xl" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    </div>
    <div className="page page-bottom space-y-6 pt-5">
      <Skeleton className="h-14 w-full rounded-control" />
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-[76px] rounded-2xl" />)}</div>
      <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <RowSkeleton key={i} />)}</div>
    </div>
  </div>;
}

export function DetailPageSkeleton() {
  return <div role="status" aria-busy="true" aria-label="Loading">
    <NavBarSkeleton />
    <div className="page page-bottom pt-4 lg:pt-6">
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="aspect-[4/3] w-full rounded-card" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4 rounded-xl" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2"><Skeleton className="h-6 w-16 rounded-full" /><Skeleton className="h-6 w-20 rounded-full" /></div>
          <div className="grid grid-cols-2 gap-3"><Skeleton className="h-control rounded-control" /><Skeleton className="h-control rounded-control" /></div>
          <div className="card divide-y divide-separator">
            {[0, 1, 2].map(i => <div key={i} className="flex h-[52px] items-center justify-between px-4"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-16" /></div>)}
          </div>
        </div>
      </div>
    </div>
  </div>;
}

export function FormPageSkeleton() {
  return <div role="status" aria-busy="true" aria-label="Loading">
    <NavBarSkeleton />
    <div className="page-narrow space-y-4 pb-10 pt-4">
      {[0, 1].map(i => <div key={i} className="card space-y-4 p-4 sm:p-5">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-control w-full rounded-control" />
        <Skeleton className="h-control w-full rounded-control" />
      </div>)}
    </div>
  </div>;
}
