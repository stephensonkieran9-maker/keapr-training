"use client";

// Shown inside the shell when a page's data fails to load.
export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="panel" role="alert">
      <div className="eyebrow"><b>Something went wrong</b></div>
      <h2 style={{ fontSize: 22, margin: "6px 0 10px" }}>This page couldn't load</h2>
      <p style={{ color: "var(--muted)", maxWidth: "60ch", margin: "0 0 14px" }}>
        Try again in a moment. If it keeps happening, send this reference to whoever maintains the app
        {error.digest ? <>: <code>{error.digest}</code></> : null}.
      </p>
      <button className="btn btn-primary" onClick={reset}>Try again</button>
    </section>
  );
}
