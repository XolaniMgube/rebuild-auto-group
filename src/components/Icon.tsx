// One icon set for the whole app: 24px grid, 1.8px rounded strokes.
export function Icon({ name, className = "h-5 w-5", strokeWidth = 1.8 }: { name: string; className?: string; strokeWidth?: number }) {
  const paths: Record<string, React.ReactNode> = {
    back: <path d="M19 12H5m6-6-6 6 6 6" />,
    "chevron-left": <path d="m15 5-7 7 7 7" />,
    chevron: <path d="m9 5 7 7-7 7" />,
    down: <path d="m6 9 6 6 6-6" />,
    updown: <path d="m8 9 4-4 4 4m-8 6 4 4 4-4" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    "close-circle": <><circle cx="12" cy="12" r="9" /><path d="m9.5 9.5 5 5m0-5-5 5" /></>,
    check: <path d="m5 12 4.5 4.5L19 7" />,
    "check-circle": <><circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.8 2.8 5.2-5.8" /></>,
    alert: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5m0 3v.01" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
    sliders: <><path d="M4 7h8m4 0h4M4 17h3m4 0h9" /><circle cx="14" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></>,
    camera: <><path d="M3 8a1 1 0 0 1 1-1h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" /><circle cx="12" cy="13" r="3.5" /></>,
    upload: <path d="M12 15V4m-5 5 5-5 5 5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />,
    file: <><path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7l-4-4Z" /><path d="M14 3v4h4M9.5 13h5m-5 4h5" /></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="1.8" /><path d="m21 16-5-5-9 9" /></>,
    logout: <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4m5-12 4 4-4 4m-8-4h12" />,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>,
    box: <><path d="m12 3 8.5 4.7v8.6L12 21l-8.5-4.7V7.7L12 3Z" /><path d="m3.5 7.7 8.5 4.7 8.5-4.7M12 12.4V21" /></>,
    car: <><path d="m5 11 1.6-4.2A2 2 0 0 1 8.5 5.5h7a2 2 0 0 1 1.9 1.3L19 11" /><path d="M3 13.5a2.5 2.5 0 0 1 2.5-2.5h13a2.5 2.5 0 0 1 2.5 2.5V17a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" /><path d="M6.5 18v1.5M17.5 18v1.5M7 14.5h1.5m7 0H17" /></>,
    checklist: <path d="M10 6h10M10 12h10M10 18h10M4 6l1.3 1.3L7.5 5M4 12l1.3 1.3L7.5 11M4 18l1.3 1.3L7.5 17" />,
    light: <><path d="M13 5C7 5 3 8 3 12s4 7 10 7V5ZM17 6l4-1m-4 5h4m-4 4h4m-4 4 4 1" /><path d="M10 8v8" /></>,
    door: <path d="m4 11 7-7h9v16H4v-9ZM7 11l5-5h6v5H7Zm9 4h2" />,
    motor: <path d="M6 8h10v12H6zM9 4h4v4M16 11h4v6h-4M3 11h3m-3 6h3M9 11v6m4-6v6" />,
    bumper: <path d="m3 8 4-3h10l4 3v9H3V8Zm0 5h18M7 17v3m10-3v3M6 9h2m8 0h2" />,
    wheel: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /><path d="M12 3v6m0 6v6M3 12h6m6 0h6" /></>,
    seat: <path d="m6 3 5 1 2 9h7v5H8L4 5l2-2Zm2 15v3m10-3v3" />,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{paths[name] ?? paths.box}</svg>;
}
