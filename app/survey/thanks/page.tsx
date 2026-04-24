import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Thanks — MentorForge",
  robots: { index: false, follow: false }
};

type Props = {
  searchParams: Promise<{ status?: string }>;
};

const COPY: Record<string, { title: string; body: string }> = {
  ok: {
    title: "Thanks — recorded.",
    body: "Your answer is saved. We look at the pattern across replies, not any single one."
  },
  missing: {
    title: "Link was incomplete.",
    body: "The survey link was missing its token. If you were just trying to reply, please click from the original email."
  },
  malformed: {
    title: "Link didn't check out.",
    body: "The survey token couldn't be parsed. It may have been copied incorrectly — try clicking the link again from the original email."
  },
  bad_signature: {
    title: "Link didn't check out.",
    body: "The survey token's signature didn't verify. If this keeps happening, email hello@mentorforge.co and we'll look."
  },
  expired: {
    title: "That link expired.",
    body: "Survey links are good for 14 days. The next weekly digest will have a fresh question — or reply to the original email directly."
  }
};

export default async function SurveyThanksPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const copy = COPY[status ?? "ok"] ?? COPY.ok!;

  return (
    <div className="mx-auto max-w-lg space-y-8 pb-16 pt-16 text-center sm:pt-24">
      <p className="mb-2 font-display text-[0.7rem] font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
        Survey
      </p>
      <h1 className="font-display text-[2rem] font-medium leading-[1.12] tracking-tight text-slate-900 dark:text-slate-50 sm:text-[2.5rem] sm:leading-[1.08]">
        {copy.title}
      </h1>
      <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
        {copy.body}
      </p>

      <div className="flex items-center justify-center gap-4 pt-4">
        <Link
          href="/app"
          className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
        >
          Open your plan
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 hover:decoration-accent dark:text-slate-300 dark:decoration-slate-600"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
