export function rands(n: number): string {
  const rounded = Math.round(n);
  const sign = rounded < 0 ? "−" : "";
  const body = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}R ${body}`;
}

/**
 * Reads what people type into a price field: "400", "R 1 250", "1,250" or "250,50".
 * Blank gives null; anything unreadable or negative gives NaN.
 */
export function parseRands(value: string): number | null {
  let cleaned = value.replace(/[Rr\s]/g, "");
  if (!cleaned) return null;
  if (/^\d+,\d{1,2}$/.test(cleaned)) cleaned = cleaned.replace(",", ".");
  const amount = Number(cleaned.replace(/,/g, ""));
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) / 100 : NaN;
}

export function randsSigned(n: number): string {
  const s = rands(n);
  return n > 0 ? `+${s}` : s;
}

/** Today's date in South Africa as YYYY-MM-DD, for date fields and defaults. */
export function todayIso(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Johannesburg" });
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
  });
}

export function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function fileSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function carName(v: { year: number | null; make: string; model: string }): string {
  return [v.year, v.make, v.model].filter(Boolean).join(" ");
}

export function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
