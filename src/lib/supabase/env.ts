// Both values are safe to ship to the browser: the publishable key can
// only do what row level security allows. Never put a secret or
// service-role key in a NEXT_PUBLIC_ variable.
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.local."
    );
  }
  return { url, key };
}
