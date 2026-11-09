"use server";

import { redirect } from "next/navigation";
import {
  currentCandidate, endSession, getAssessmentBySlug, registerCandidate, signInCandidate, startAttempt,
} from "@/lib/assessment/server";

export type FormState = { error?: string } | undefined;

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");

export async function registerAction(_: FormState, fd: FormData): Promise<FormState> {
  const slug = str(fd, "slug");
  const a = await getAssessmentBySlug(slug);
  if (!a) return { error: "This assessment link isn't valid." };
  if (str(fd, "consent") !== "on") return { error: "Please confirm you agree to your details being used to assess your application." };
  const r = await registerCandidate(a, { fullName: str(fd, "fullName"), email: str(fd, "email"), phone: str(fd, "phone"), password: str(fd, "password") });
  if (!r.ok) return { error: r.error };
  redirect(`/assess/${slug}`);
}

export async function signInAction(_: FormState, fd: FormData): Promise<FormState> {
  const slug = str(fd, "slug");
  const a = await getAssessmentBySlug(slug);
  if (!a) return { error: "This assessment link isn't valid." };
  const r = await signInCandidate(a, str(fd, "email"), str(fd, "password"));
  if (!r.ok) return { error: r.error };
  redirect(`/assess/${slug}`);
}

export async function startAction(_: FormState, fd: FormData): Promise<FormState> {
  const slug = str(fd, "slug");
  const a = await getAssessmentBySlug(slug);
  if (!a) return { error: "This assessment link isn't valid." };
  const c = await currentCandidate(a.id);
  if (!c) redirect(`/assess/${slug}`);
  const r = await startAttempt(a, c);
  if ("error" in r) return { error: r.error };
  redirect(`/assess/${slug}/test`);
}

export async function signOutAction(fd: FormData) {
  await endSession();
  redirect(`/assess/${str(fd, "slug")}?mode=signin`);
}
