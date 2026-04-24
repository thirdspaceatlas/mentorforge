"use client";

import Link from "next/link";

/**
 * Inline cap-hit card shown when a free-tier user exhausts a weekly cap
 * (calendar connections, Calendar Coach nudges, smart rebalances).
 *
 * Style follows DESIGN.md: calm competence, emerald accent, no modal/blocker.
 * Dismissible so the user can keep using the rest of the dashboard.
 */

type CapType = "calendar" | "rebalance" | "nudges";

type Props = {
  capType: CapType;
  used: number;
  cap: number;
  /** ISO string for next reset; only shown for weekly caps. */
  resetsAt?: string;
  onDismiss?: () => void;
};

function formatResetLabel(resetsAt: string | undefined): string | null {
  if (!resetsAt) return null;
  const date = new Date(resetsAt);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  const diffDays = Math.max(
    0,
    Math.round((date.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
  );
  if (diffDays === 0) return "Resets today";
  if (diffDays === 1) return "Resets tomorrow";
  return `Resets in ${diffDays} days`;
}

const COPY: Record<
  CapType,
  { eyebrow: string; headline: string; body: (used: number, cap: number) => string }
> = {
  calendar: {
    eyebrow: "Calendar limit reached",
    headline: "One calendar is on the house.",
    body: (used, cap) =>
      `You're using ${used} of ${cap} calendar connection. Upgrade to All Access to sync work, personal, and shared calendars together.`
  },
  rebalance: {
    eyebrow: "Weekly rebalance used",
    headline: "You've used this week's smart rebalance.",
    body: (used, cap) =>
      `${used} of ${cap} rebalance used. Free plan gets one rebalance per week — All Access is unlimited so you can recover any week you miss.`
  },
  nudges: {
    eyebrow: "Nudges paused until reset",
    headline: "You've used all your Calendar Coach nudges this week.",
    body: (used, cap) =>
      `${used} of ${cap} nudges sent. Your schedule stays visible — you just won't get new prompts until reset. Upgrade for unlimited nudges.`
  }
};

export function CapHitCard({ capType, used, cap, resetsAt, onDismiss }: Props) {
  const copy = COPY[capType];
  const reset = formatResetLabel(resetsAt);

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative flex flex-col gap-3 rounded-2xl border border-accent/30 bg-white p-5 shadow-sm dark:border-accent/40 dark:bg-[#0f1520] sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent"
          aria-hidden
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
            <path d="M12 9v4m0 3h.01" strokeLinecap="round" />
            <path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" strokeLinejoin="round" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[0.7rem] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            {copy.eyebrow}
          </p>
          <p className="mt-1 font-display text-[1.05rem] font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-[1.15rem]">
            {copy.headline}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {copy.body(used, cap)}
          </p>
          {reset ? (
            <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              {reset}
            </p>
          ) : null}
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss upgrade prompt"
            className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 pl-11 sm:flex-row sm:items-center sm:gap-3">
        <Link
          href="/pricing"
          className="inline-flex min-h-[2.5rem] items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 dark:ring-offset-[#0f1520]"
        >
          Upgrade to All Access — $99/yr
        </Link>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Less than one Schweser mock.
        </span>
      </div>
    </div>
  );
}
