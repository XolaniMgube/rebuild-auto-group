"use client";

import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import type { Condition, PartStatus } from "@/lib/types";
import { CONDITION_LABEL, STATUS_LABEL } from "@/lib/types";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-mist mt-1">{hint}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-lg border-[1.5px] border-hairline bg-white px-3 py-2.5 text-[15px] font-semibold text-ink " +
  "placeholder:font-medium placeholder:text-mist " +
  "focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blueTint transition";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${inputBase} resize-none ${props.className ?? ""}`}
    />
  );
}

export function Select({
  children,
  ...props
}: InputHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select
      {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
      className={`${inputBase} ${props.className ?? ""}`}
    >
      {children}
    </select>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const styles: Record<string, string> = {
    // Red is the action colour. Nothing else gets it.
    primary: "bg-brand-red text-white hover:bg-brand-redDeep",
    secondary:
      "bg-white text-brand-blue border-[1.5px] border-brand-blue hover:bg-brand-blueTint",
    ghost: "bg-white text-ink border-[1.5px] border-hairline hover:bg-paper",
    danger: "bg-white text-warn border-[1.5px] border-warn hover:bg-warnTint",
  };
  return (
    <button
      {...props}
      className={`font-narrow font-bold text-[15px] rounded-lg px-4 py-3 transition
        disabled:opacity-40 disabled:pointer-events-none
        focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blueTint
        ${styles[variant]} ${className}`}
    />
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-lg border-[1.5px] py-2.5 text-[13px] font-semibold transition
            ${
              value === o.value
                ? "bg-brand-blue border-brand-blue text-white"
                : "bg-white border-hairline text-slate hover:border-mist"
            }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ConditionPill({ condition }: { condition: Condition }) {
  const tone =
    condition === "GOOD"
      ? "bg-brand-blueTint text-brand-blue"
      : "bg-warnTint text-warn";
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${tone}`}>
      {CONDITION_LABEL[condition]}
    </span>
  );
}

export function StatusPill({ status }: { status: PartStatus }) {
  const tone: Record<PartStatus, string> = {
    DRAFT: "bg-brand-redTint text-brand-red",
    IN_STOCK: "bg-brand-blueTint text-brand-blue",
    RESERVED: "bg-warnTint text-warn",
    SOLD: "bg-[#E7EAEC] text-slate",
    RETURNED: "bg-[#E7EAEC] text-slate",
  };
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${tone[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Empty({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function SearchIcon({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.6" />
      <path d="M20 20l-4.2-4.2" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
