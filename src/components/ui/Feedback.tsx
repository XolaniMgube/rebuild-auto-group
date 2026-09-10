import type { ReactNode } from "react";
import { Icon } from "../Icon";

export function Spinner({ className = "h-5 w-5", tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return <span aria-hidden="true" className={`inline-block shrink-0 animate-spin rounded-full border-2 ${tone === "light" ? "border-white/30 border-t-white" : "border-ink/10 border-t-ink/60"} ${className}`} />;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

export function EmptyState({ icon = "box", title, description, action, className = "" }: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return <div className={`flex flex-col items-center px-6 py-12 text-center ${className}`}>
    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-subtle text-secondary"><Icon name={icon} className="h-6 w-6" /></span>
    <h2 className="mt-4 text-card">{title}</h2>
    {description && <p className="mt-1.5 max-w-xs text-body text-secondary">{description}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>;
}

/** Page-level confirmation or problem, e.g. "Part added". */
export function Notice({ tone = "success", children, onDismiss }: { tone?: "success" | "error"; children: ReactNode; onDismiss?: () => void }) {
  const styles = tone === "success" ? "bg-brand-navy-tint text-brand-navy" : "bg-brand-red-tint text-brand-red";
  return <div role={tone === "error" ? "alert" : "status"} className={`flex min-h-12 items-center gap-3 rounded-control pl-4 pr-1.5 text-[14px] font-medium ${styles}`}>
    <Icon name={tone === "success" ? "check-circle" : "alert"} className="h-5 w-5 shrink-0" />
    <span className="min-w-0 flex-1 py-3">{children}</span>
    {onDismiss && <button type="button" onClick={onDismiss} aria-label="Dismiss" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl opacity-70 transition hover:opacity-100"><Icon name="close" className="h-4 w-4" /></button>}
  </div>;
}

/** Validation or save errors next to the thing that failed. */
export function InlineError({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p role="alert" className={`flex items-start gap-2 text-[14px] leading-snug text-brand-red ${className}`}>
    <Icon name="alert" className="mt-px h-4 w-4 shrink-0" />
    <span>{children}</span>
  </p>;
}
