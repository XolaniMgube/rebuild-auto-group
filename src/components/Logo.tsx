import Image from "next/image";
import icon from "../../public/logos/Logo icon.png";
import logo from "../../public/logos/RAG Logo.png";

export function BrandIcon({ className = "h-8 w-8", priority = false }: {
  className?: string;
  priority?: boolean;
}) {
  return <Image src={icon} alt="" width={96} height={96} sizes="96px" priority={priority}
    className={`shrink-0 object-contain ${className}`} />;
}

export function BrandLogo({ className = "w-24", priority = false, sizes = "(min-width: 1024px) 192px, 96px" }: {
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return <Image src={logo} alt="Rebuild Auto Group" width={192} height={96}
    sizes={sizes} priority={priority}
    className={`h-auto shrink-0 object-contain ${className}`} />;
}
