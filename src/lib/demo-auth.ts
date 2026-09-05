// ===============================================================
//  ⚠️  DEMO GATE — DELETE THIS FILE WHEN SUPABASE AUTH GOES IN  ⚠️
//
//  These credentials ship in the client bundle. Anyone who opens
//  devtools on the deployed site can read them. That is fine right
//  now: the data is fake and the point is to let Mitchel click
//  around a Vercel link.
//
//  It is NOT fine the moment real stock and real revenue are in
//  here. Replace with supabase.auth.signInWithPassword() and
//  verify the session server-side in every route handler.
// ===============================================================

export const DEMO_EMAIL = "mitch@rebuildautogroup.co.za";
export const DEMO_PASSWORD = "Mitch123";

/** Returns the user id on success, or null. */
export function checkDemoCredentials(
  email: string,
  password: string
): string | null {
  const matches =
    email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;
  return matches ? "u_mitchel" : null;
}
