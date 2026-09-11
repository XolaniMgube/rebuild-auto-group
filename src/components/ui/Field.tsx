import type { ComponentProps, ReactNode } from "react";
import { Icon } from "../Icon";

const LABEL = "mb-2 block text-[13px] font-semibold text-ink";

export function Field({ label, hint, error, children, className = "" }: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return <label className={`block ${className}`}>
    <span className={LABEL}>{label}</span>
    {children}
    {error
      ? <span className="mt-1.5 block text-[13px] text-brand-red">{error}</span>
      : hint && <span className="mt-1.5 block text-[13px] leading-snug text-secondary">{hint}</span>}
  </label>;
}

/** For groups of buttons, where a wrapping <label> would misbehave. */
export function FieldSet({ legend, children }: { legend: string; children: ReactNode }) {
  return <fieldset className="min-w-0">
    <legend className={LABEL}>{legend}</legend>
    {children}
  </fieldset>;
}

export function Input({ className = "", invalid, ...props }: ComponentProps<"input"> & { invalid?: boolean }) {
  return <input {...props} aria-invalid={invalid || undefined} className={`control ${className}`} />;
}

export function Textarea({ className = "", ...props }: ComponentProps<"textarea">) {
  return <textarea {...props} className={`control resize-none py-3.5 leading-relaxed ${className}`} />;
}

export function Select({ className = "", children, ...props }: ComponentProps<"select">) {
  return <span className="relative block">
    <select {...props} className={`control appearance-none pr-11 ${className}`}>{children}</select>
    <Icon name="updown" className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-tertiary" />
  </span>;
}

/** Rand amount field with a fixed "R" prefix. Parse the value with parseRands. */
export function MoneyInput({ className = "", compact = false, ...props }: Omit<ComponentProps<"input">, "type"> & { compact?: boolean }) {
  return <span className={`relative block ${className}`}>
    <span aria-hidden="true" className={`pointer-events-none absolute top-1/2 -translate-y-1/2 font-medium text-secondary ${compact ? "left-3 text-[15px]" : "left-4"}`}>R</span>
    <input type="text" inputMode="decimal" autoComplete="off" {...props} className={`control tabular-nums disabled:bg-subtle ${compact ? "min-h-11 pl-7 pr-3" : "pl-9"}`} />
  </span>;
}

/** Round, iOS-style checkbox. */
export function CheckCircle({ className = "", ...props }: Omit<ComponentProps<"input">, "type">) {
  return <span className={`relative grid h-6 w-6 shrink-0 place-items-center ${className}`}>
    <input type="checkbox" {...props} className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-full border-[1.5px] border-tertiary/70 bg-surface transition duration-fast ease-ios checked:border-brand-navy checked:bg-brand-navy disabled:cursor-default disabled:opacity-50" />
    <Icon name="check" className="pointer-events-none relative h-3.5 w-3.5 text-white opacity-0 transition duration-fast peer-checked:opacity-100" />
  </span>;
}
