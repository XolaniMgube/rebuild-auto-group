import type { Config } from "tailwindcss";

// Every value points at a CSS variable in src/app/globals.css, so the design
// tokens live in one place and still work with Tailwind's opacity modifiers.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: token("canvas"),
        surface: token("surface"),
        subtle: token("subtle"),
        ink: token("ink"),
        secondary: token("secondary"),
        tertiary: token("tertiary"),
        line: token("line"),
        separator: token("separator"),
        brand: {
          red: token("brand-red"),
          "red-pressed": token("brand-red-pressed"),
          "red-tint": token("brand-red-tint"),
          navy: token("brand-navy"),
          "navy-pressed": token("brand-navy-pressed"),
          "navy-tint": token("brand-navy-tint"),
        },
        success: { DEFAULT: token("success"), tint: token("success-tint") },
        warning: { DEFAULT: token("warning"), tint: token("warning-tint") },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", '"SF Pro Display"', '"SF Pro Text"', "Inter", '"Segoe UI"', "Roboto", '"Helvetica Neue"', "Arial", "sans-serif"],
      },
      fontSize: {
        "large-title": ["32px", { lineHeight: "1.1", letterSpacing: "-0.035em", fontWeight: "700" }],
        title: ["26px", { lineHeight: "1.15", letterSpacing: "-0.03em", fontWeight: "700" }],
        section: ["20px", { lineHeight: "1.25", letterSpacing: "-0.02em", fontWeight: "600" }],
        card: ["16px", { lineHeight: "1.3", letterSpacing: "-0.015em", fontWeight: "600" }],
        body: ["15px", { lineHeight: "1.45", letterSpacing: "-0.01em" }],
        meta: ["13px", { lineHeight: "1.35" }],
        caption: ["12px", { lineHeight: "1.3" }],
      },
      spacing: {
        control: "var(--control-height)",
        nav: "var(--nav-height)",
        sidebar: "var(--sidebar-width)",
      },
      borderRadius: {
        card: "var(--radius-card)",
        control: "var(--radius-control)",
        thumb: "var(--radius-thumb)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        raised: "var(--shadow-raised)",
        fab: "var(--shadow-fab)",
        sheet: "var(--shadow-sheet)",
        nav: "var(--shadow-nav)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        base: "var(--duration-base)",
      },
      transitionTimingFunction: {
        ios: "var(--ease-ios)",
      },
    },
  },
  plugins: [],
};
export default config;
