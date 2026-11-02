import { Archivo_Black } from "next/font/google";
import Image from "next/image";
import icon from "../../public/logos/icon-transparent.png";

// Only the wordmark uses this face, so it's loaded here rather than app-wide.
const wordmark = Archivo_Black({ weight: "400", subsets: ["latin"], display: "swap" });

export function BrandIcon({ className = "h-8 w-8", priority = false }: {
  className?: string;
  priority?: boolean;
}) {
  return <Image src={icon} alt="" width={96} height={96} sizes="96px" priority={priority}
    className={`shrink-0 object-contain ${className}`} />;
}

// Font size drives the whole lockup: the gear and the gap are sized in em.
const SIZES = { sm: "text-[17px]", md: "text-[20px]", lg: "text-[23px]", xl: "text-[35px]" };

/**
 * The gear and "RAG" set as live type rather than a flattened image, so the
 * letter spacing and vertical alignment stay exact and sharp at every size.
 */
export function BrandLogo({ size = "md", tagline = true, priority = false, className = "" }: {
  size?: keyof typeof SIZES;
  tagline?: boolean;
  priority?: boolean;
  className?: string;
}) {
  return <span role="img" aria-label="Rebuild Auto Group"
    className={`inline-flex shrink-0 select-none items-center gap-[0.22em] leading-none ${SIZES[size]} ${className}`}>
    {/* The artwork has a built-in margin; negative margins trim it so the gap is the real gap. */}
    <Image src={icon} alt="" width={96} height={96} sizes="96px" priority={priority}
      className="-my-[0.3em] -ml-[0.3em] -mr-[0.25em] h-[2.1em] w-[2.1em] shrink-0 object-contain" />
    <span aria-hidden="true" className="flex flex-col">
      <span className={`${wordmark.className} translate-y-[0.03em] tracking-[0.09em]`}>
        <span className="text-brand-red">R</span><span className="text-brand-navy">AG</span>
      </span>
      {/* Never below 8px, so it stays legible on the small phone logo. */}
      {tagline && <span className="mt-[0.3em] whitespace-nowrap text-[max(0.3em,8px)] font-bold uppercase tracking-[0.22em] text-ink/70">Rebuild Auto Group</span>}
    </span>
  </span>;
}
