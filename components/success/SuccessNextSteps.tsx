"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PlanHint =
  | { kind: "weeks"; examLevel: string; examDateLabel: string; weekCount: number }
  | { kind: "prefs" }
  | { kind: "none" };

function formatExamShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SuccessNextSteps() {
  const [hint, setHint] = useState<PlanHint | null>(null);

  useEffect(() => {
    fetch("/api/study-plan")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const p = data?.plan;
        if (!p || typeof p.examLevel !== "string") {
          setHint({ kind: "none" });
          return;
        }
        const wp = p.weekPlan;
        const weekCount = Array.isArray(wp) ? wp.length : 0;
        if (weekCount > 0 && typeof p.examDate === "string") {
          setHint({
            kind: "weeks",
            examLevel: p.examLevel,
            examDateLabel: formatExamShort(p.examDate),
            weekCount,
          });
        } else {
          setHint({ kind: "prefs" });
        }
      })
      .catch(() => setHint({ kind: "none" }));
  }, []);

  const detail =
    hint == null ? (
      <div
        className="mt-3 h-12 max-w-md animate-pulse rounded-md bg-slate-200/70 dark:bg-slate-700/70"
        aria-hidden
      />
    ) : hint.kind === "weeks" ? (
      <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        Your week-by-week roadmap is still here — Level {hint.examLevel},{" "}
        {hint.examDateLabel}, {hint.weekCount} week
        {hint.weekCount === 1 ? "" : "s"} — exactly as you built it on Plan.
      </p>
    ) : hint.kind === "prefs" ? (
      <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        Your exam preferences are saved. Add your week-by-week roadmap on Plan
        whenever you&apos;re ready — then Calendar Coach can slot sessions around
        your calendar.
      </p>
    ) : (
      <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        When you&apos;re ready, build your study plan on Plan and connect Calendar
        Coach so we can find study windows in your real schedule.
      </p>
    );

  return (
    <div className="rounded-2xl border border-hair bg-white p-6 text-left shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
      <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-amber-mf">
        <span aria-hidden className="inline-block h-px w-4 bg-amber-mf" />
        What&apos;s next
      </p>
      <h2 className="mt-2 font-display text-xl font-medium tracking-tight text-ink dark:text-slate-100 sm:text-2xl">
        Your study plan wasn&apos;t reset
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        Everything you set up on Plan — exam window, weekly hours, and your
        roadmap — stays on your account. Upgrading only unlocks more; it
        doesn&apos;t wipe your work.
      </p>
      {detail}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href="/app/today"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400"
        >
          Open Calendar Coach
        </Link>
        <Link
          href="/app"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-hair bg-paper px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-white dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          Review study plan
        </Link>
      </div>
      <p className="mt-6 text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        Next step: connect a calendar in Calendar Coach so we can find study
        windows around your schedule.{" "}
        <Link
          href="/app/onboarding"
          className="font-medium text-emerald-800 underline decoration-emerald-800/30 underline-offset-2 hover:text-emerald-900 dark:text-emerald-400 dark:decoration-emerald-400/40"
        >
          Calendar setup
        </Link>{" "}
        walks you through it.
      </p>
    </div>
  );
}
