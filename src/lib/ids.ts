const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

// crypto.randomUUID only exists on HTTPS and localhost. Phones testing
// against a dev machine over the local network use plain http.
export function randomName(): string {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

// Every stored photo has a small preview beside it: `abc.jpg` and `abc-thumb.jpg`.
export function thumbPathFor(path: string): string {
  return path.replace(/\.jpg$/, "-thumb.jpg");
}
