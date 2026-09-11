import { AuthCard } from "@/components/AuthCard";
import { LoginForm } from "./LoginForm";

const NOTICES: Record<string, string> = {
  link: "That link has expired or was already used. Request a new one.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <AuthCard title="Sign in" description="Use the email address your invite was sent to.">
      <LoginForm next={next} notice={error ? NOTICES[error] : undefined} />
    </AuthCard>
  );
}
