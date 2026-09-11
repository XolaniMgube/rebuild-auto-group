import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { BrandLogo } from "./Logo";
import { Notice } from "./ui";

const FEATURES = [
  { icon: "car", title: "Every car is a project", text: "Photos, papers and a strip list per car" },
  { icon: "tag", title: "Asking price vs. sold price", text: "Discounts, costs and profit per car" },
  { icon: "box", title: "Find any part fast", text: "Search by name, car or shelf" },
];

/**
 * Sign-in screens. Phones get a brand header with the form card rising over it;
 * desktops split into a brand panel and the form.
 */
export function AuthCard({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
    <aside className="auth-hero sticky top-0 hidden h-dvh flex-col justify-between overflow-hidden p-12 text-white lg:flex xl:p-16">
      <LogoChip size="lg" />
      <div className="max-w-[460px]">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/60">Rebuild Auto Group</p>
        <h2 className="mt-3 text-[42px] font-bold leading-[1.06] tracking-[-0.035em] xl:text-[48px]">Strip it. Price it. Sell it.</h2>
        <ul className="mt-10 space-y-5">{FEATURES.map(feature => <li key={feature.title} className="flex items-center gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-inset ring-white/15 backdrop-blur-sm"><Icon name={feature.icon} className="h-[22px] w-[22px]" /></span>
          <span>
            <span className="block text-[16px] font-semibold">{feature.title}</span>
            <span className="block text-meta text-white/65">{feature.text}</span>
          </span>
        </li>)}</ul>
      </div>
      <p className="flex items-center gap-2 text-meta text-white/55"><Icon name="lock" className="h-4 w-4" />Owners and invited staff only</p>
    </aside>

    <main className="flex min-h-dvh flex-col">
      <header className="auth-hero px-5 pb-20 text-white lg:hidden" style={{ paddingTop: "max(24px, env(safe-area-inset-top))" }}>
        <div className="mx-auto w-full max-w-[440px]">
          <LogoChip size="sm" />
          <p className="mt-7 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/65">Rebuild Auto Group</p>
          <p className="mt-1.5 text-[26px] font-bold leading-tight tracking-[-0.03em]">Strip it. Price it. Sell it.</p>
        </div>
      </header>

      <div className="-mt-12 flex flex-1 flex-col px-4 lg:mt-0 lg:justify-center lg:px-10" style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
        <section className="mx-auto w-full max-w-[440px] rounded-[28px] border border-line/70 bg-surface p-5 shadow-raised sm:p-7 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
          <h1 className="text-large-title lg:text-[36px]">{title}</h1>
          {description && <p className="mt-2 text-body text-secondary">{description}</p>}
          <div className="mt-6 lg:mt-8">{children}</div>
        </section>
        <p className="mx-auto mt-6 flex items-center gap-1.5 text-caption text-tertiary lg:hidden"><Icon name="lock" className="h-3.5 w-3.5" />Owners and invited staff only</p>
      </div>
    </main>
  </div>;
}

// The logo is red and navy, so it sits on a white chip over the navy backdrop.
function LogoChip({ size }: { size: "sm" | "lg" }) {
  return <span className={`inline-flex self-start rounded-2xl bg-white shadow-raised ${size === "lg" ? "px-4 py-3" : "px-3 py-2"}`}>
    <BrandLogo priority sizes={size === "lg" ? "120px" : "92px"} className={size === "lg" ? "w-[120px]" : "w-[92px]"} />
  </span>;
}

export function FormMessage({ error, message }: { error?: string; message?: string }) {
  if (error) return <Notice tone="error">{error}</Notice>;
  if (message) return <Notice>{message}</Notice>;
  return null;
}
