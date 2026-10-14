"use client";

import { useState } from "react";

export function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  async function copy(e: React.MouseEvent<HTMLButtonElement>) {
    const input = e.currentTarget.parentElement?.querySelector("input");
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      input?.select();
    }
  }
  return (
    <div className="copybox">
      <input readOnly value={link} aria-label="Sign-in link" onFocus={(e) => e.currentTarget.select()} />
      <button type="button" className="btn btn-primary btn-sm" onClick={copy}>
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
