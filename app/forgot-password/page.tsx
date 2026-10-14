import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotForm } from "@/components/auth/ForgotForm";

export const metadata = { title: "Reset password · Keapr Training" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      intro="Enter your work email and we'll send you a link to choose a new password."
      footer={<Link href="/login">Back to sign in</Link>}
    >
      <ForgotForm />
    </AuthCard>
  );
}
