import { AuthCard } from "@/components/auth/AuthCard";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";

export const metadata = { title: "Choose a password · Keapr Training" };

export default function SetPasswordPage() {
  return (
    <AuthCard title="Choose a password" intro="You'll use this with your work email to sign in.">
      <SetPasswordForm />
    </AuthCard>
  );
}
