"use client";

import type { KeyboardEvent } from "react";
import { Icon } from "../Icon";

type Option<T extends string> = { value: T; label: string };

export function SearchBar({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <div className="flex h-14 min-w-0 flex-1 items-center gap-3 rounded-control border border-line bg-surface px-4 shadow-[0_1px_2px_rgb(15_23_42/0.04)] transition duration-fast ease-ios focus-within:border-brand-navy/40 focus-within:ring-4 focus-within:ring-brand-navy/10">
    <Icon name="search" className="h-5 w-5 shrink-0 text-tertiary" />
    <input type="search" enterKeyHint="search" aria-label={label} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
      className="h-full min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-tertiary" />
    {value && <button type="button" aria-label="Clear search" onClick={() => onChange("")} className="-mr-2.5 grid h-11 w-11 shrink-0 place-items-center rounded-full text-tertiary transition hover:text-secondary">
      <Icon name="close-circle" className="h-5 w-5" />
    </button>}
  </div>;
}

export function FilterButton({ count, onClick, className = "" }: { count: number; onClick: () => void; className?: string }) {
  return <button type="button" onClick={onClick} aria-haspopup="dialog" aria-label={`Filters${count ? `, ${count} active` : ""}`}
    className={`pressable relative grid h-14 w-14 shrink-0 place-items-center rounded-control border bg-surface shadow-[0_1px_2px_rgb(15_23_42/0.04)] ${count ? "border-brand-navy/40 text-brand-navy" : "border-line text-ink"} ${className}`}>
    <Icon name="sliders" className="h-[22px] w-[22px]" />
    {count > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-navy px-1 text-[11px] font-semibold text-white">{count}</span>}
  </button>;
}

export function ChipGroup<T extends string>({ label, options, value, onChange }: { label: string; options: Option<T>[]; value: T; onChange: (value: T) => void }) {
  return <div role="group" aria-label={label} className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
    {options.map(option => {
      const selected = option.value === value;
      return <button key={option.value} type="button" aria-pressed={selected} onClick={() => onChange(option.value)}
        className={`pressable inline-flex h-11 shrink-0 items-center rounded-full border px-4 text-[14px] font-medium ${selected ? "border-ink bg-ink text-white shadow-[0_2px_8px_rgb(15_23_42/0.16)]" : "border-line bg-surface text-secondary hover:text-ink"}`}>
        {option.label}
      </button>;
    })}
  </div>;
}

export type TileTone = "navy" | "success" | "warning" | "neutral";

// Desktop tiles lead with a tinted icon square; phones keep the compact dot.
export const TILE_ICON: Record<TileTone, string> = {
  navy: "bg-brand-navy-tint text-brand-navy",
  success: "bg-success-tint text-success",
  warning: "bg-warning-tint text-warning",
  neutral: "bg-subtle text-secondary",
};

export const TILE_DOT: Record<TileTone, string> = {
  navy: "bg-brand-navy",
  success: "bg-success",
  warning: "bg-warning",
  neutral: "bg-tertiary",
};

/** Summary tiles that double as a single-choice filter, e.g. All / In stock / On hold. */
export function FilterTiles<T extends string>({ label, options, value, onChange }: {
  label: string;
  options: (Option<T> & { count: number; tone: TileTone; icon?: string })[];
  value: T;
  onChange: (value: T) => void;
}) {
  return <div role="group" aria-label={label} className="grid grid-cols-3 gap-2.5 sm:gap-3 lg:gap-4">
    {options.map(option => {
      const selected = option.value === value;
      return <button key={option.value} type="button" aria-pressed={selected} onClick={() => onChange(option.value)}
        className={`pressable flex items-center gap-4 rounded-2xl border px-3.5 py-3 text-left sm:px-4 sm:py-3.5 lg:px-5 lg:py-4 ${selected ? "border-brand-navy/30 bg-brand-navy-tint shadow-[inset_0_0_0_1px_rgb(18_63_148/0.12)]" : "border-line/70 bg-surface shadow-card hover:border-line"}`}>
        {option.icon && <span aria-hidden="true" className={`hidden h-14 w-14 shrink-0 place-items-center rounded-2xl lg:grid ${TILE_ICON[option.tone]}`}>
          <Icon name={option.icon} className="h-7 w-7" />
        </span>}
        <span className="min-w-0 flex-1">
          <span className={`flex items-center gap-1.5 truncate text-meta font-medium lg:text-body ${selected ? "text-brand-navy" : "text-secondary"}`}>
            <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${TILE_DOT[option.tone]} ${option.icon ? "lg:hidden" : ""}`} />{option.label}
          </span>
          <span className="mt-1.5 block text-[24px] font-bold leading-none tracking-[-0.03em] tabular-nums text-ink sm:text-[28px] lg:mt-2 lg:text-[30px]">{option.count}</span>
        </span>
        {option.icon && <Icon name="chevron" className="hidden h-4 w-4 shrink-0 text-tertiary lg:block" />}
      </button>;
    })}
  </div>;
}

/**
 * iOS segmented control. With `tabs`, it renders an accessible tablist whose
 * buttons have ids `tab-<value>` and control panels with ids `panel-<value>`.
 */
export function SegmentedControl<T extends string>({ label, options, value, onChange, tabs = false }: {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  tabs?: boolean;
}) {
  function onKeyDown(event: KeyboardEvent, index: number) {
    const moves: Record<string, number> = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: options.length - 1 };
    if (!tabs || !(event.key in moves)) return;
    event.preventDefault();
    const next = options[(moves[event.key] + options.length) % options.length];
    onChange(next.value);
    document.getElementById(`tab-${next.value}`)?.focus();
  }

  return <div role={tabs ? "tablist" : "group"} aria-label={label} className="flex gap-1 rounded-[14px] bg-ink/[0.06] p-1">
    {options.map((option, index) => {
      const selected = option.value === value;
      return <button key={option.value} type="button" onClick={() => onChange(option.value)} onKeyDown={e => onKeyDown(e, index)}
        id={tabs ? `tab-${option.value}` : undefined} role={tabs ? "tab" : undefined} aria-selected={tabs ? selected : undefined}
        aria-controls={tabs ? `panel-${option.value}` : undefined} aria-pressed={tabs ? undefined : selected} tabIndex={tabs && !selected ? -1 : undefined}
        className={`min-h-10 flex-1 rounded-[10px] px-3 text-[14px] font-semibold transition duration-fast ease-ios ${selected ? "bg-surface text-ink shadow-[0_1px_3px_rgb(15_23_42/0.12)]" : "text-secondary hover:text-ink"}`}>
        {option.label}
      </button>;
    })}
  </div>;
}
