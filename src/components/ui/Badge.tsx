import type { ReactNode } from "react";
import { CONDITION_LABEL, STATUS_LABEL, type Condition, type PartStatus } from "@/lib/types";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const TONES: Record<Tone, string> = {
  success: "bg-success-tint text-success",
  warning: "bg-warning-tint text-warning",
  danger: "bg-brand-red-tint text-brand-red",
  info: "bg-brand-navy-tint text-brand-navy",
  neutral: "bg-subtle text-secondary",
};

export function Badge({ tone = "neutral", dot = false, className = "", children }: { tone?: Tone; dot?: boolean; className?: string; children: ReactNode }) {
  return <span className={`inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-caption font-medium ${TONES[tone]} ${className}`}>
    {dot && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />}
    {children}
  </span>;
}

const CONDITION_TONE: Record<Condition, Tone> = { good: "success", fair: "warning", spares_only: "danger" };
const STATUS_TONE: Record<PartStatus, Tone> = { in_stock: "info", reserved: "warning", sold: "neutral", returned: "neutral", draft: "danger" };

export function ConditionBadge({ condition }: { condition: Condition }) {
  return <Badge tone={CONDITION_TONE[condition]} dot>{CONDITION_LABEL[condition]}</Badge>;
}

export function StatusBadge({ status }: { status: PartStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>;
}

export function CountBadge({ children }: { children: ReactNode }) {
  return <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-ink/[0.06] px-2.5 text-meta font-semibold tabular-nums text-secondary">{children}</span>;
}
