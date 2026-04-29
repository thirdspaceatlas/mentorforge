"use client";

import { useEffect, useState, type ReactNode, type SyntheticEvent } from "react";
import {
  formatDecimalHours,
  summarize,
  type ConsistencyDay,
} from "@/lib/calendar/recent-consistency";

const STORAGE_KEY = "mf:dashboard:trends:open";

/**
 * Wraps trend visualizations in a calm, collapsed-by-default disclosure.
 * Open/closed state persists in localStorage so the page does not nag users
 * who don't want data on every load.
 *
 * When `days` is provided, a one-line teaser ("X of Y days · Z.Zh logged")
 * renders below the editorial title even when collapsed — gives the card
 * weight without forcing it open.
 */
export function TrendsDisclosure({
  children,
  days,
}: {
  children: ReactNode;
  days?: ConsistencyDay[];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") setOpen(true);
    } catch {
      /* localStorage unavailable — fall back to closed default */
    }
  }, []);

  const handleToggle = (e: SyntheticEvent<HTMLDetailsElement>) => {
    const next = e.currentTarget.open;
    setOpen(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  return (
    <details
      open={open}
      onToggle={handleToggle}
      className="group mt-[18px] rounded-2xl border border-hair bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-7"
    >
      <summary className="flex cursor-pointer list-none items-end justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <div>
          <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-amber-mf">
            <span aria-hidden className="inline-block h-px w-4 bg-amber-mf" />
            Trends
          </p>
          <h2 className="mt-2 font-display text-2xl font-medium leading-tight tracking-tight text-ink dark:text-slate-100 sm:text-[26px]">
            Last sixteen days.
          </h2>
          {days && days.length > 0 && (
            <p className="mt-1.5 text-[12.5px] text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-ink dark:text-slate-100">
                {summarize(days).daysStudied} of {summarize(days).total}
              </span>{" "}
              days{" "}
              <span className="text-slate-300 dark:text-slate-600">·</span>{" "}
              <span className="font-mono tabular-nums">
                {formatDecimalHours(summarize(days).totalMinutes)}
              </span>{" "}
              logged
            </p>
          )}
        </div>
        <span className="flex shrink-0 items-center gap-1.5 pb-1 text-xs font-medium text-slate-500 transition-colors group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-slate-200">
          <span className="hidden sm:inline">{open ? "Hide" : "Show"}</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className={"transition-transform " + (open ? "rotate-180" : "")}
          >
            <path d="M3 4.5l3 3 3-3" />
          </svg>
        </span>
      </summary>
      <div className="mt-6">{children}</div>
    </details>
  );
}
