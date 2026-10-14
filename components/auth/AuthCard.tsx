import Link from "next/link";

export function AuthCard({ title, intro, children, footer }: {
  title: string;
  intro?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="auth-page">
      <main className="auth-card">
        <Link href="/login" className="auth-brand">
          <span className="mark">K</span>
          <span>Keapr<small>Training</small></span>
        </Link>
        <h1>{title}</h1>
        {intro && <p className="auth-intro">{intro}</p>}
        {children}
        {footer && <div className="auth-foot">{footer}</div>}
      </main>
    </div>
  );
}
