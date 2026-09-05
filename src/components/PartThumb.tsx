"use client";
import { Icon } from "./Icon";

// Real photo if we have one, otherwise a deterministic gradient so
// the list still reads cleanly instead of showing broken images.

const TONES = [
  ["#C3CAD1", "#939EA8"],
  ["#7C8791", "#4B555E"],
  ["#B9C2C9", "#87939D"],
  ["#9AA5AE", "#5E6A73"],
];

function toneFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

export function PartThumb({
  id,
  image,
  className = "h-14 w-14",
  rounded = "rounded-lg",
}: {
  id: string;
  image?: string | null;
  className?: string;
  rounded?: string;
}) {
  if (image) {
    return (
      // Data URLs from the camera — next/image would need a loader
      // for these, and they're already resized on capture.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        className={`${className} ${rounded} shrink-0 object-cover bg-paper`}
      />
    );
  }
  const [a, b] = toneFor(id);
  return (
    <div
      className={`${className} ${rounded} shrink-0 relative overflow-hidden`}
      style={{ background: `linear-gradient(140deg, ${a}, ${b})` }}
      aria-hidden="true"
    >
      <Icon name="box" className="absolute w-8 h-8 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/80"/>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 30% 27%, rgba(255,255,255,.8), transparent 45%)",
        }}
      />
    </div>
  );
}
