import { Icon } from "./Icon";

type Kind = { icon: string; tone: string };

// Each part family gets its own outline and colour, so a freshly stripped car's
// parts scan at a glance before any photos are added. Order matters: the first
// match wins ("Door card" is interior, "Steering wheel" is not a wheel).
const KINDS: [RegExp, Kind][] = [
  [/door card|headliner|carpet|seat|dashboard|airbag|console|instrument|radio|infotainment|steering wheel/, { icon: "seat", tone: "bg-violet-50 text-violet-600" }],
  [/light|lamp|indicator/, { icon: "light", tone: "bg-amber-50 text-amber-600" }],
  [/glass|windscreen/, { icon: "glass", tone: "bg-cyan-50 text-cyan-700" }],
  [/battery|fuse|wiper|horn|switch|\bkey\b|immobiliser|sensor|\becu\b|harness/, { icon: "bolt", tone: "bg-teal-50 text-teal-700" }],
  [/bumper|grille|spoiler|fender|radiator support/, { icon: "bumper", tone: "bg-sky-50 text-sky-700" }],
  [/brake|caliper|\babs\b|shock|strut|control arm|steering rack|suspension|wheel|tyre|\brims?\b/, { icon: "wheel", tone: "bg-slate-100 text-slate-600" }],
  [/engine|motor|alternator|turbo|gearbox|clutch|radiator|pump|injector|throttle|manifold|intercooler|compressor|condenser|driveshaft|\bfan\b|filter|exhaust|catalytic|silencer/, { icon: "motor", tone: "bg-orange-50 text-orange-600" }],
  [/door|bonnet|boot|tailgate|mirror|regulator|panel/, { icon: "door", tone: "bg-sky-50 text-sky-700" }],
];

const OTHER: Kind = { icon: "box", tone: "bg-subtle text-tertiary" };

/** Outline and tint for a part without a photo, picked from its name. */
export function partKind(name: string): Kind {
  const label = name.toLowerCase();
  return KINDS.find(([pattern]) => pattern.test(label))?.[1] ?? OTHER;
}

export function PartThumb({ image, name = "", className = "h-20 w-20" }: { image?: string | null; name?: string; className?: string }) {
  if (image) {
    // Signed Storage URLs expire, so they skip next/image's cache. Photos are resized before upload.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" loading="lazy" className={`${className} shrink-0 rounded-thumb bg-subtle object-contain`} />;
  }
  const kind = partKind(name);
  return <div aria-hidden="true" className={`${className} grid shrink-0 place-items-center rounded-thumb ${kind.tone}`}>
    <Icon name={kind.icon} className="h-7 w-7" />
  </div>;
}
