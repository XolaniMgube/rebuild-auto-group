import { redirect } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { createClient } from "@/lib/supabase/server";
import { LockFooter, LockForm } from "./LockForm";

/** Shown once a day: the session is still good, the password just has to be proved again. */
export default async function LockPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("name, email").eq("id", data.claims.sub).maybeSingle();
  const email = profile?.email ?? String(data.claims.email ?? "");
  const raw = (profile?.name || email.split("@")[0] || "").trim();
  const name = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "";

  return (
    <AuthCard title={name ? `Welcome back, ${name}` : "Welcome back"} description="Unlock with your password. You only do this once a day.">
      <LockForm email={email} next={next} />
      <LockFooter />
    </AuthCard>
  );
}
