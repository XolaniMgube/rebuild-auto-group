// Works around a PostgREST bug (PostgREST/postgrest#5196, fixed upstream in
// September 2026): a stale internal clock rejects a brand-new session token as
// "JWT issued at future", typically for under a second right after signing in.
// Rejected requests never reach the database, so retrying is safe. Remove once
// the project runs a PostgREST release with the fix.
const RETRY_DELAYS_MS = [500, 1000, 1500];

export const supabaseFetch: typeof fetch = async (input, init) => {
  let response = await fetch(input, init);
  for (const delay of RETRY_DELAYS_MS) {
    if (response.status !== 401) return response;
    const body = await response.clone().text();
    if (!body.includes("JWT issued at future")) return response;
    await new Promise((resolve) => setTimeout(resolve, delay));
    // Next.js memoizes identical GET requests during a server render, which
    // would hand back the same rejection. A fresh signal opts out.
    response = await fetch(input, { ...init, signal: init?.signal ?? new AbortController().signal });
  }
  return response;
};
