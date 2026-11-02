import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { SessionProvider } from "@/components/Session";
import { BottomNav, Sidebar } from "@/components/Shell";
import { Button, ConfirmProvider } from "@/components/ui";
import { getWorkspaceCounts } from "@/lib/data";
import { isUnlocked, LOCK_PATH, UNLOCK_COOKIE } from "@/lib/lock";
import { createClient } from "@/lib/supabase/server";

// Checked again here rather than trusting middleware alone.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  // Middleware normally catches this; checked again here so no page can slip past.
  if (!isUnlocked((await cookies()).get(UNLOCK_COOKIE)?.value, data.claims.session_id)) redirect(LOCK_PATH);

  const [{ data: profile, error }, counts] = await Promise.all([
    supabase.from("profiles").select("name, email, role").eq("id", data.claims.sub).maybeSingle(),
    getWorkspaceCounts(),
  ]);
  // A failed lookup is not the same as "no access"; let the error screen offer a retry.
  if (error) throw new Error(error.message);

  if (!profile?.role) {
    return (
      <AuthCard title="Waiting for access" description={<>An owner needs to give <span className="font-semibold text-ink">{profile?.email}</span> access.</>}>
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="secondary" block>Sign out</Button>
        </form>
      </AuthCard>
    );
  }

  return (
    <SessionProvider session={{ id: data.claims.sub, name: profile.name || profile.email, email: profile.email, role: profile.role }} counts={counts}>
      <ConfirmProvider>
        <Sidebar />
        <div className="min-h-dvh lg:pl-sidebar">{children}</div>
        <BottomNav />
      </ConfirmProvider>
    </SessionProvider>
  );
}
