"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import { BrandLogo } from "./Logo";
import { useCounts, useSession } from "./Session";
import { Badge, Button, buttonClass, CountBadge, IconButton, Sheet } from "./ui";

const TABS = [
  { href: "/search", label: "Parts", icon: "box", match: (path: string) => path.startsWith("/search") || path.startsWith("/parts/") },
  { href: "/cars", label: "Projects", icon: "car", match: (path: string) => path.startsWith("/cars") },
];

// Full-screen tasks hide the tab bar so the save button owns the bottom edge.
const TASK_SCREENS = ["/add", "/cars/new"];

/** "Add part" from a project page pre-selects that car. */
function addPartHref(path: string) {
  const projectId = path.match(/^\/cars\/([0-9a-f-]{36})$/)?.[1];
  return projectId ? `/add?car=${projectId}` : "/add";
}

/* --------------------------------------------------------------------------
   Desktop sidebar
   -------------------------------------------------------------------------- */

export function Sidebar() {
  const path = usePathname();
  const session = useSession();

  return <aside className="fixed inset-y-0 left-0 z-30 hidden w-sidebar flex-col border-r border-line/80 bg-surface shadow-[12px_0_40px_-32px_rgb(15_23_42/0.35)] lg:flex">
    <div className="flex h-[76px] shrink-0 items-center border-b border-separator px-7">
      <Link href="/search" aria-label="Rebuild Auto Group home" className="flex items-center">
        <BrandLogo priority sizes="104px" className="w-[104px]" />
      </Link>
    </div>

    <div className="flex-1 space-y-7 overflow-y-auto px-4 py-6">
      <SidebarSection label="Create">
        <div className="space-y-2">
          <Link href={addPartHref(path)} className={buttonClass({ size: "sm", block: true, className: "justify-start px-3" })}>
            <Icon name="plus" strokeWidth={2.2} />Add part
          </Link>
          <Link href="/cars/new" className={buttonClass({ variant: "secondary", size: "sm", block: true, className: "justify-start px-3" })}>
            <Icon name="car" />New project
          </Link>
        </div>
      </SidebarSection>
      <Suspense fallback={null}><SidebarNav /></Suspense>
    </div>

    <div className="shrink-0 border-t border-separator p-4">
      <div className="flex items-center gap-3 rounded-2xl border border-line/70 bg-canvas p-2.5 pr-1">
        <Avatar name={session.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold">{session.name}</p>
          <p className="truncate text-caption text-secondary"><span className="capitalize">{session.role}</span> · {session.email}</p>
        </div>
        <form action="/auth/signout" method="post"><IconButton type="submit" label="Sign out" icon="logout" variant="plain" /></form>
      </div>
    </div>
  </aside>;
}

function SidebarNav() {
  const path = usePathname();
  const params = useSearchParams();
  const counts = useCounts();
  const owner = useSession().role === "owner";
  const status = path.startsWith("/search") ? params.get("status") : null;

  return <>
    <SidebarSection label="Workspace">
      <nav aria-label="Main navigation" className="space-y-1">
        <NavItem href="/search" icon="box" label="Parts" count={counts ? counts.inStock + counts.onHold : undefined}
          active={(path.startsWith("/search") && !status) || path.startsWith("/parts/")} />
        <NavItem href="/cars" icon="car" label="Projects" count={counts?.projects} active={path.startsWith("/cars")} />
        {owner && <NavItem href="/deleted" icon="trash" label="Recently deleted" active={path.startsWith("/deleted")} />}
      </nav>
    </SidebarSection>
    <SidebarSection label="Quick filters">
      <nav aria-label="Quick filters" className="space-y-1">
        <NavItem href="/search?status=in_stock" dot="bg-success" label="In stock" count={counts?.inStock} active={status === "in_stock"} />
        <NavItem href="/search?status=reserved" dot="bg-warning" label="On hold" count={counts?.onHold} active={status === "reserved"} />
      </nav>
    </SidebarSection>
  </>;
}

function SidebarSection({ label, children }: { label: string; children: ReactNode }) {
  return <section>
    <h2 className="mb-2.5 px-3 text-[11px] font-semibold uppercase tracking-[0.09em] text-tertiary">{label}</h2>
    {children}
  </section>;
}

function NavItem({ href, label, count, active, icon, dot }: { href: string; label: string; count?: number; active: boolean; icon?: string; dot?: string }) {
  return <Link href={href} aria-current={active ? "page" : undefined}
    className={`group flex min-h-11 items-center gap-3 rounded-xl px-2 text-[15px] font-medium transition duration-fast ease-ios ${active ? "bg-brand-navy-tint text-brand-navy" : "text-ink/80 hover:bg-subtle hover:text-ink"}`}>
    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition duration-fast ${active ? "bg-brand-navy text-white shadow-[0_4px_10px_-4px_rgb(18_63_148/0.6)]" : "bg-subtle text-ink/70 group-hover:bg-surface"}`}>
      {icon ? <Icon name={icon} className="h-[18px] w-[18px]" strokeWidth={2} /> : <span className={`h-2.5 w-2.5 rounded-full ${dot} ${active ? "ring-2 ring-white" : ""}`} />}
    </span>
    <span className="flex-1 truncate">{label}</span>
    {count !== undefined && <span className={`min-w-7 rounded-full px-2 py-0.5 text-center text-caption font-semibold tabular-nums ${active ? "bg-surface text-brand-navy" : "bg-subtle text-secondary"}`}>{count}</span>}
  </Link>;
}

/* --------------------------------------------------------------------------
   Mobile tab bar
   -------------------------------------------------------------------------- */

export function BottomNav() {
  const path = usePathname();
  if (TASK_SCREENS.includes(path) || path.endsWith("/strip")) return null;
  const [parts, projects] = TABS;

  // A floating bar: solid surface and real depth so it reads clearly over any content.
  return <nav aria-label="Main navigation" className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 lg:hidden" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
    {/* Items sit on a shared bottom edge so all three labels line up; the Add button simply rises above the bar. */}
    <div className="pointer-events-auto mx-auto grid h-nav max-w-md grid-cols-3 grid-rows-1 items-end rounded-[26px] border border-line/60 bg-surface/95 px-2 shadow-nav backdrop-blur-xl">
      <TabLink tab={parts} active={parts.match(path)} />
      <Link href={addPartHref(path)} className="group flex flex-col items-center gap-1 pb-2 text-[12px] font-semibold leading-4 text-ink">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-red text-white shadow-fab ring-4 ring-surface transition duration-fast ease-ios group-hover:bg-brand-red-pressed group-active:scale-95">
          <Icon name="plus" className="h-7 w-7" strokeWidth={2.4} />
        </span>
        Add part
      </Link>
      <TabLink tab={projects} active={projects.match(path)} />
    </div>
  </nav>;
}

function TabLink({ tab, active }: { tab: (typeof TABS)[number]; active: boolean }) {
  return <Link href={tab.href} aria-current={active ? "page" : undefined}
    className={`group flex h-full flex-col items-center justify-end gap-1 pb-2 text-[12px] leading-4 transition duration-fast ${active ? "font-semibold text-brand-navy" : "font-medium text-ink/70 hover:text-ink"}`}>
    <span className={`grid h-9 w-16 place-items-center rounded-full transition duration-base ease-ios group-active:scale-90 ${active ? "bg-brand-navy text-white shadow-[0_6px_14px_-4px_rgb(18_63_148/0.5)]" : "text-ink/80"}`}>
      <Icon name={tab.icon} className="h-6 w-6" strokeWidth={active ? 2.2 : 2} />
    </span>
    {tab.label}
  </Link>;
}

/* --------------------------------------------------------------------------
   Headers
   -------------------------------------------------------------------------- */

/**
 * Header band for the main screens. On phones the brand gets its own row
 * (logo left, account right) above the title, so the heading stands alone.
 */
export function PageHeader({ eyebrow, title, count, description, actions }: {
  eyebrow?: string;
  title: string;
  count?: number;
  description?: string;
  actions?: ReactNode;
}) {
  return <header className="border-b border-line/70 bg-surface" style={{ paddingTop: "env(safe-area-inset-top)" }}>
    <div className="page pb-5 pt-2 lg:pb-8 lg:pt-10">
      <div className="flex h-12 items-center justify-between lg:hidden">
        <Link href="/search" aria-label="Rebuild Auto Group home" className="-ml-1 flex h-11 items-center px-1">
          <BrandLogo priority sizes="88px" className="w-[88px]" />
        </Link>
        <AccountButton />
      </div>
      <div className="mt-3 flex items-end justify-between gap-6 lg:mt-0">
        <div className="min-w-0">
          {eyebrow && <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-brand-navy">{eyebrow}</p>}
          <div className="mt-1 flex items-center gap-2.5">
            <h1 className="truncate text-large-title lg:text-[36px]">{title}</h1>
            {count !== undefined && <CountBadge>{count}</CountBadge>}
          </div>
          {description && <p className="mt-1.5 max-w-xl text-body text-secondary">{description}</p>}
        </div>
        {actions && <div className="hidden shrink-0 items-center gap-3 lg:flex">{actions}</div>}
      </div>
    </div>
  </header>;
}

/** Navigation bar for secondary screens: back link, title, optional action. */
export function NavBar({ back, title, heading = true, action }: { back: { href: string; label: string }; title?: string; heading?: boolean; action?: ReactNode }) {
  const Title = heading ? "h1" : "p";
  return <header className="bar-surface sticky top-0 z-20 border-b border-line/60" style={{ paddingTop: "env(safe-area-inset-top)" }}>
    <div className="page grid h-14 grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] items-center gap-2">
      <Link href={back.href} className="-ml-2 flex h-11 min-w-0 items-center justify-self-start rounded-xl pr-2 text-[16px] font-medium text-brand-navy transition hover:bg-brand-navy-tint/60">
        <Icon name="chevron-left" className="h-6 w-6 shrink-0" />
        <span className="truncate">{back.label}</span>
      </Link>
      <Title className="truncate text-center text-[16px] font-semibold">{title}</Title>
      <div className="flex justify-end">{action}</div>
    </div>
  </header>;
}

/** Sticky save bar for task screens. */
export function FormFooter({ children }: { children: ReactNode }) {
  return <div className="bar-surface sticky bottom-0 z-20 border-t border-line/60" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
    <div className="page-narrow space-y-3 pt-3">{children}</div>
  </div>;
}

function AccountButton() {
  const session = useSession();
  const [open, setOpen] = useState(false);

  return <>
    <button type="button" aria-label="Account" onClick={() => setOpen(true)} className="pressable grid h-11 w-11 place-items-center rounded-full">
      <Avatar name={session.name} small />
    </button>
    <Sheet open={open} onClose={() => setOpen(false)} title="Account">
      <div className="flex items-center gap-3.5">
        <Avatar name={session.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-card">{session.name}</p>
          <p className="truncate text-meta text-secondary">{session.email}</p>
        </div>
        <Badge tone="info">{session.role === "owner" ? "Owner" : "Staff"}</Badge>
      </div>
      {session.role === "owner" && <Link href="/deleted" onClick={() => setOpen(false)} className="card-link mt-6 flex min-h-14 items-center gap-3.5 px-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-red-tint text-brand-red"><Icon name="trash" className="h-[18px] w-[18px]" /></span>
        <span className="flex-1 text-body font-semibold">Recently deleted</span>
        <Icon name="chevron" className="h-4 w-4 text-tertiary" />
      </Link>}
      <form action="/auth/signout" method="post" className="mt-6">
        <Button type="submit" variant="secondary" block><Icon name="logout" />Sign out</Button>
      </form>
    </Sheet>
  </>;
}

function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  return <span aria-hidden="true" className={`grid shrink-0 place-items-center rounded-full bg-brand-navy font-semibold uppercase text-white shadow-[0_4px_10px_-4px_rgb(18_63_148/0.6)] ${small ? "h-9 w-9 text-[14px]" : "h-10 w-10 text-[15px]"}`}>
    {name.trim()[0] ?? "?"}
  </span>;
}
