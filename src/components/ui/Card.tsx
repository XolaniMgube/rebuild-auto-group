import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "../Icon";
import { CountBadge } from "./Badge";

/** "section" titles a block of content; "group" labels a grouped list, Settings-style. */
export function SectionHeading({ title, count, action, variant = "section" }: {
  title: string;
  count?: number;
  action?: ReactNode;
  variant?: "section" | "group";
}) {
  const group = variant === "group";
  return <div className={`flex items-center justify-between gap-3 px-1 ${group ? "mb-2" : "mb-3 min-h-11"}`}>
    <h2 className={group ? "text-[13px] font-semibold uppercase tracking-[0.06em] text-secondary" : "flex items-center gap-2 text-[19px] font-semibold tracking-[-0.02em]"}>
      {title}
      {count !== undefined && !group && <CountBadge>{count}</CountBadge>}
    </h2>
    {action}
  </div>;
}

const STAT_DOT = { navy: "bg-brand-navy", success: "bg-success", warning: "bg-warning", neutral: "bg-tertiary" };

/** Read-only summary numbers at the top of a screen. */
export function StatTiles({ items }: { items: { label: string; value: number | string; tone: keyof typeof STAT_DOT }[] }) {
  return <dl className="grid grid-cols-3 gap-2.5 sm:gap-3">
    {items.map(item => <div key={item.label} className="rounded-2xl border border-line/70 bg-surface px-3.5 py-3 shadow-card sm:px-4 sm:py-3.5">
      <dt className="flex items-center gap-1.5 truncate text-meta font-medium text-secondary">
        <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${STAT_DOT[item.tone]}`} />{item.label}
      </dt>
      <dd className="mt-1.5 text-[24px] font-bold leading-none tracking-[-0.03em] tabular-nums sm:text-[28px]">{item.value}</dd>
    </div>)}
  </dl>;
}

export function FormSection({ title, aside, children, className = "" }: { title?: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`card p-4 sm:p-5 ${className}`}>
    {title && <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-card">{title}</h2>
      {aside && <span className="text-meta tabular-nums text-secondary">{aside}</span>}
    </div>}
    <div className="space-y-4">{children}</div>
  </section>;
}

export function DisclosureCard({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return <details className="card group">
    <summary className="flex min-h-14 cursor-pointer select-none items-center gap-3 px-4 text-card sm:px-5">
      {title}
      {aside && <span className="ml-auto text-meta font-normal text-secondary">{aside}</span>}
      <Icon name="down" className={`h-4 w-4 text-tertiary transition duration-base ease-ios group-open:rotate-180 ${aside ? "" : "ml-auto"}`} />
    </summary>
    <div className="space-y-4 px-4 pb-5 sm:px-5">{children}</div>
  </details>;
}

export function DetailList({ children }: { children: ReactNode }) {
  return <dl className="card divide-y divide-separator">{children}</dl>;
}

export function DetailRow({ label, value, icon, muted = false }: { label: string; value: ReactNode; icon?: string; muted?: boolean }) {
  return <div className="flex min-h-[52px] items-center justify-between gap-4 px-4 py-3">
    <dt className="flex shrink-0 items-center gap-2.5 text-body text-secondary">
      {icon && <Icon name={icon} className="h-[18px] w-[18px] text-tertiary" />}
      {label}
    </dt>
    <dd className={`min-w-0 break-words text-right text-body font-medium ${muted ? "text-tertiary" : "text-ink"}`}>{value}</dd>
  </div>;
}

export function RowLink({ href, icon, label, title }: { href: string; icon: string; label: string; title: string }) {
  return <Link href={href} className="card-link flex min-h-16 items-center gap-3.5 px-4 py-3">
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-navy-tint text-brand-navy"><Icon name={icon} className="h-5 w-5" /></span>
    <span className="min-w-0 flex-1">
      <span className="block text-meta text-secondary">{label}</span>
      <span className="block truncate text-card">{title}</span>
    </span>
    <Icon name="chevron" className="h-4 w-4 shrink-0 text-tertiary" />
  </Link>;
}
