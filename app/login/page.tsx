import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignInForm } from "@/components/auth/SignInForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in · Keapr Training" };

const notices: Record<string, string> = {
  inactive: "Your account has been deactivated. Speak to your manager if you think this is a mistake.",
  "no-profile": "Your account isn't set up yet. Ask an administrator to finish setting it up.",
  link: "That link has expired or has already been used. Request a new one below.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  if (!isSupabaseConfigured()) redirect("/dashboard");
  const { next, error } = await searchParams;
  return (
    <AuthCard
      title="Sign in"
      intro="Use the email address your invitation was sent to."
      footer={<>No account? Training is invite-only. Ask your manager for an invitation. <Link href="/demo">View the demo</Link></>}
    >
      <SignInForm next={next} notice={error ? notices[error] : undefined} />
    </AuthCard>
  );
}
