// Only same-site paths are allowed after sign-in or an email link.
// Blocks open redirects such as //evil.com and /\evil.com.
export function safeNext(value: unknown, fallback = "/search"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
