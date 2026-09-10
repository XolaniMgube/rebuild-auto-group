import Link from "next/link";
import type { ComponentProps } from "react";
import { Icon } from "../Icon";
import { Spinner } from "./Feedback";

export type ButtonVariant = "primary" | "secondary" | "danger" | "plain";
export type IconButtonVariant = "surface" | "plain" | "accent" | "overlay" | "dark";
type ButtonStyle = { variant?: ButtonVariant; size?: "md" | "sm"; block?: boolean; className?: string };
type IconButtonStyle = { variant?: IconButtonVariant; size?: "md" | "lg"; className?: string };

// Red is reserved for the main action on a screen; everything else is quiet.
const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand-red text-white shadow-[0_1px_2px_rgb(219_32_39/0.3)] hover:bg-brand-red-pressed",
  secondary: "border border-line bg-surface text-ink shadow-[0_1px_2px_rgb(15_23_42/0.04)] hover:bg-subtle",
  danger: "bg-brand-red-tint text-brand-red hover:bg-brand-red/15",
  plain: "text-brand-navy hover:bg-brand-navy-tint",
};

const SIZES = {
  md: "min-h-control rounded-control px-5 text-[15px]",
  sm: "min-h-11 rounded-[14px] px-4 text-[14px]",
};

const ICON_VARIANTS: Record<IconButtonVariant, string> = {
  surface: "border border-line bg-surface text-ink shadow-[0_1px_2px_rgb(15_23_42/0.04)] hover:bg-subtle",
  plain: "text-secondary hover:bg-ink/[0.05] hover:text-ink",
  accent: "text-brand-navy hover:bg-brand-navy-tint",
  overlay: "bg-surface/90 text-ink shadow-raised backdrop-blur-md hover:bg-surface",
  dark: "bg-ink text-white hover:bg-ink/90",
};

const ICON_SIZES = {
  md: "h-11 w-11 rounded-[14px]",
  lg: "h-14 w-14 rounded-control",
};

/** Button styling, shared with links that act as buttons. */
export function buttonClass({ variant = "primary", size = "md", block = false, className = "" }: ButtonStyle = {}) {
  return `pressable inline-flex select-none items-center justify-center gap-2 font-semibold ${SIZES[size]} ${VARIANTS[variant]} ${block ? "w-full" : ""} ${className}`;
}

export function iconButtonClass({ variant = "surface", size = "md", className = "" }: IconButtonStyle = {}) {
  return `pressable inline-flex shrink-0 items-center justify-center ${ICON_SIZES[size]} ${ICON_VARIANTS[variant]} ${className}`;
}

export function Button({ variant, size, block, loading = false, className, disabled, children, ...props }: ComponentProps<"button"> & ButtonStyle & { loading?: boolean }) {
  return <button type="button" {...props} disabled={disabled || loading} aria-busy={loading || undefined} className={buttonClass({ variant, size, block, className })}>
    {loading && <Spinner className="h-4 w-4" tone={(variant ?? "primary") === "primary" ? "light" : "dark"} />}
    {children}
  </button>;
}

export function ButtonLink({ variant, size, block, className, ...props }: ComponentProps<typeof Link> & ButtonStyle) {
  return <Link {...props} className={buttonClass({ variant, size, block, className })} />;
}

export function IconButton({ label, icon, variant, size, className, ...props }: Omit<ComponentProps<"button">, "children"> & IconButtonStyle & { label: string; icon: string }) {
  return <button type="button" aria-label={label} {...props} className={iconButtonClass({ variant, size, className })}>
    <Icon name={icon} className={size === "lg" ? "h-6 w-6" : "h-5 w-5"} />
  </button>;
}

export function IconLink({ label, icon, variant, size, className, ...props }: Omit<ComponentProps<typeof Link>, "children"> & IconButtonStyle & { label: string; icon: string }) {
  return <Link aria-label={label} {...props} className={iconButtonClass({ variant, size, className })}>
    <Icon name={icon} className={size === "lg" ? "h-6 w-6" : "h-5 w-5"} />
  </Link>;
}
