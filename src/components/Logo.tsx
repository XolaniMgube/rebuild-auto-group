// Two interlocking gears with the R inside, rebuilt as SVG so it
// stays crisp at 24px in the app header. Teeth are drawn with a
// dash-array on a thick stroke — cheap and clean at small sizes.

export function GearMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden="true">
      <circle cx="41" cy="41" r="21" stroke="#DB2027" strokeWidth="7" />
      <circle
        cx="41" cy="41" r="28"
        stroke="#DB2027" strokeWidth="8" strokeDasharray="9.5 5.16"
      />
      <circle cx="68" cy="70" r="12" stroke="#123F94" strokeWidth="6" />
      <circle
        cx="68" cy="70" r="17.5"
        stroke="#123F94" strokeWidth="6.5" strokeDasharray="6.5 3.66"
      />
      <path
        d="M33 30 h11 a8.5 8.5 0 0 1 1.6 16.8 L53 57 h-8.4 l-6.6 -9.6 V57 H33 Z"
        fill="#DB2027"
      />
    </svg>
  );
}

export function Wordmark({
  withSub = false,
  className = "text-base",
}: {
  withSub?: boolean;
  className?: string;
}) {
  return (
    <span className={`font-narrow font-bold leading-none ${className}`}>
      <span className="text-brand-red">RE</span>
      <span className="text-brand-blue">BUILD</span>
      {withSub && (
        <span className="block text-[8px] tracking-[0.22em] text-mist mt-[3px] font-semibold">
          AUTO GROUP
        </span>
      )}
    </span>
  );
}

export function Lockup({
  markClass = "h-7 w-7",
  textClass = "text-base",
  withSub = false,
}: {
  markClass?: string;
  textClass?: string;
  withSub?: boolean;
}) {
  return (
    <span className="flex items-center gap-2">
      <GearMark className={`shrink-0 ${markClass}`} />
      <Wordmark withSub={withSub} className={textClass} />
    </span>
  );
}
