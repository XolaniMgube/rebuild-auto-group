export function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></>,
    car: <><path d="m5 8 2-4h10l2 4 2 3v7H3v-7l2-3Z M3 10h18 M6 14h2m8 0h2 M6 18v2m12-2v2"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    box: <><path d="m12 3 9 5v9l-9 5-9-5V8l9-5Z M3 8l9 5 9-5 M12 13v9 M8 5l9 5"/></>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5"/>,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    logout: <path d="M9 4H4v16h5m5-12 4 4-4 4m-6-4h10"/>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{paths[name] ?? paths.box}</svg>;
}

export function CarArt({ color = "#97acbc" }: { color?: string }) {
 return <svg viewBox="0 0 480 200" fill="none" aria-hidden="true" className="w-full h-full"><ellipse cx="242" cy="166" rx="188" ry="13" fill="#102c48" opacity=".10"/><path d="m58 118 42-14 53-53h147l66 49 54 14 12 35H48l10-31Z" fill={color}/><path d="m121 101 40-39h58v39h-98Zm110 0V62h64l51 39H231Z" fill="#203a51"/><path d="M237 69h53l36 26h-89V69Z" fill="#3c5668"/><path d="M52 134h377M221 107v35M341 107l10 33" stroke="#203a51" opacity=".3" strokeWidth="2"/><rect x="242" y="111" width="18" height="4" rx="2" fill="#203a51"/><path d="m61 119 29-7-5 15H58m328-11 26 6 4 10h-27" fill="#edf5ff"/><circle cx="119" cy="146" r="29" fill="#1b2d3c"/><circle cx="119" cy="146" r="17" fill="#dae2e8"/><circle cx="119" cy="146" r="8" fill="#7f94a5"/><circle cx="357" cy="146" r="29" fill="#1b2d3c"/><circle cx="357" cy="146" r="17" fill="#dae2e8"/><circle cx="357" cy="146" r="8" fill="#7f94a5"/></svg>;
}
