"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { registerAction, signInAction, startAction, type FormState } from "@/app/assess/actions";

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <button className="btn btn-primary auth-submit" type="submit" disabled={pending}>{pending ? "Please wait…" : children}</button>;
}

function ErrorNote({ state }: { state: FormState }) {
  return state?.error ? <p className="notice error" role="alert">{state.error}</p> : null;
}

export function RegisterForm({ slug }: { slug: string }) {
  const [state, action] = useActionState(registerAction, undefined);
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="slug" value={slug} />
      <ErrorNote state={state} />
      <div className="field"><label htmlFor="r-name">Full name</label><input id="r-name" name="fullName" autoComplete="name" required maxLength={120} /></div>
      <div className="field"><label htmlFor="r-email">Email</label><input id="r-email" name="email" type="email" autoComplete="email" required maxLength={200} /></div>
      <div className="field"><label htmlFor="r-phone">Phone <span className="optional">(optional)</span></label><input id="r-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} /></div>
      <div className="field">
        <label htmlFor="r-pw">Create a password</label>
        <input id="r-pw" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={200} aria-describedby="r-pw-hint" />
        <p className="hint" id="r-pw-hint">At least 8 characters. You&apos;ll need it if you come back to this page.</p>
      </div>
      <label className="check consent">
        <input type="checkbox" name="consent" required />
        <span>I agree to Keapr storing my details and answers to assess my job application.</span>
      </label>
      <Submit>Register</Submit>
    </form>
  );
}

export function SignInForm({ slug }: { slug: string }) {
  const [state, action] = useActionState(signInAction, undefined);
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="slug" value={slug} />
      <ErrorNote state={state} />
      <div className="field"><label htmlFor="s-email">Email</label><input id="s-email" name="email" type="email" autoComplete="email" required /></div>
      <div className="field"><label htmlFor="s-pw">Password</label><input id="s-pw" name="password" type="password" autoComplete="current-password" required /></div>
      <Submit>Sign in</Submit>
    </form>
  );
}

export function StartForm({ slug }: { slug: string }) {
  const [state, action] = useActionState(startAction, undefined);
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="slug" value={slug} />
      <ErrorNote state={state} />
      <label className="check consent">
        <input type="checkbox" required />
        <span>I&apos;m ready to start.</span>
      </label>
      <Submit>Start test</Submit>
    </form>
  );
}
