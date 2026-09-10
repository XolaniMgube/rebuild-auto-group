import { Icon } from "./Icon";

/** Picks a recognisable outline for parts without a photo. */
export function partIcon(name: string) {
  const label = name.toLowerCase();
  return /light|indicator/.test(label) ? "light"
    : /door|bonnet|boot/.test(label) ? "door"
    : /motor|alternator|engine|turbo|gearbox/.test(label) ? "motor"
    : /bumper|dashboard/.test(label) ? "bumper"
    : /wheel|steering|tyre|rim/.test(label) ? "wheel"
    : /seat/.test(label) ? "seat"
    : "box";
}

export function PartThumb({ image, name = "", className = "h-20 w-20" }: { image?: string | null; name?: string; className?: string }) {
  if (image) {
    // Signed Storage URLs expire, so they skip next/image's cache. Photos are resized before upload.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" loading="lazy" className={`${className} shrink-0 rounded-thumb bg-subtle object-contain`} />;
  }
  return <div aria-hidden="true" className={`${className} grid shrink-0 place-items-center rounded-thumb bg-subtle text-tertiary`}>
    <Icon name={partIcon(name)} className="h-7 w-7" />
  </div>;
}
