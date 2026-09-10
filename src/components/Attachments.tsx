"use client";

import { useRef } from "react";
import { Icon } from "./Icon";
import { buttonClass, iconButtonClass } from "./ui";

/**
 * Take a photo with the phone's camera, or pick a file already on the device.
 * The camera button only shows on touch screens: on a laptop `capture` is
 * ignored, so it would just open a second file picker.
 */
export function MediaPicker({ label, onFiles, accept = "image/*", multiple = false, disabled = false, compact = false, tone = "surface", uploadText = "Upload", className = "" }: {
  label: string;
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  compact?: boolean;
  tone?: "surface" | "overlay";
  uploadText?: string;
  className?: string;
}) {
  const camera = useRef<HTMLInputElement>(null);
  const upload = useRef<HTMLInputElement>(null);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length) onFiles(files);
  }

  const style = compact ? iconButtonClass({ variant: tone }) : buttonClass({ variant: "secondary", className: "flex-1" });

  return <div className={`flex gap-2 ${className}`}>
    <button type="button" disabled={disabled} onClick={() => camera.current?.click()} aria-label={compact ? `Take ${label}` : undefined}
      className={`${style} hidden [@media(pointer:coarse)]:inline-flex`}>
      <Icon name="camera" />{!compact && "Take photo"}
    </button>
    <button type="button" disabled={disabled} onClick={() => upload.current?.click()} aria-label={compact ? `Upload ${label}` : undefined} className={style}>
      <Icon name="upload" />{!compact && uploadText}
    </button>
    <input ref={camera} type="file" accept="image/*" capture="environment" onChange={pick} className="hidden" tabIndex={-1} data-picker={label} data-source="camera" />
    <input ref={upload} type="file" accept={accept} multiple={multiple} onChange={pick} className="hidden" tabIndex={-1} data-picker={label} data-source="upload" />
  </div>;
}

/** Small × pinned to the corner of a thumbnail. The parent needs `relative`. */
export function RemoveButton({ label, onClick, disabled = false }: { label: string; onClick: () => void; disabled?: boolean }) {
  return <button type="button" disabled={disabled} onClick={onClick} aria-label={label}
    className="absolute -right-2.5 -top-2.5 grid h-10 w-10 place-items-center disabled:opacity-40">
    <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-white shadow-raised ring-2 ring-surface"><Icon name="close" className="h-3.5 w-3.5" /></span>
  </button>;
}

/** Image preview for scans, a document icon for PDFs. */
export function FileTile({ thumbUrl }: { thumbUrl: string | null }) {
  if (thumbUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={thumbUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl bg-subtle object-cover" />;
  }
  return <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-red-tint text-brand-red"><Icon name="file" /></span>;
}
