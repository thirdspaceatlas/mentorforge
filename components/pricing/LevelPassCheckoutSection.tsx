"use client";

import { useState, type ReactNode } from "react";
import type { ExamWindow } from "@/lib/plan/exam-expiry";
import { postCheckout } from "./checkout-api";
import { Events, track } from "@/lib/analytics";

const WINDOWS: { value: ExamWindow; label: string }[] = [
  { value: "february", label: "February" },
  { value: "may", label: "May" },
  { value: "august", label: "August" },
  { value: "november", label: "November" }
];

const LEVELS = ["I", "II", "III"] as const;

function yearOptions(): number[] {
  const y = new Date().getFullYear();
  return [y, y + 1, y + 2];
}

type Props = {
  priceId: string;
  buttonClassName: string;
  footnote?: ReactNode;
};

export function LevelPassCheckoutSection({ priceId, buttonClassName, footnote }: Props) {
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("I");
  const [examWindow, setExamWindow] = useState<ExamWindow>("february");
  const [examYear, setExamYear] = useState(yearOptions()[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    if (!priceId) {
      setError("Price ID is not configured.");
      return;
    }
    track(Events.upgradeClicked, {
      source_location: "pricing_page",
      cap_type_if_applicable: "none",
      target_tier: "level_pass",
    });
    setLoading(true);
    setError(null);
    const result = await postCheckout({
      planKey: "level_pass",
      priceId,
      examWindow,
      examYear,
      levelUnlocked: level
    });
    setLoading(false);
    if (result.ok && result.url) {
      window.location.href = result.url;
      return;
    }
    setError(result.error ?? `Checkout failed (${result.status})`);
  }

  return (
    <div className="mt-auto pt-8">
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setError(null);
        }}
        className={buttonClassName}
      >
        Buy Level Pass
      </button>
      {footnote}
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="level-pass-modal-title"
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-600 dark:bg-slate-900">
            <h2
              id="level-pass-modal-title"
              className="font-display text-lg font-semibold text-slate-900 dark:text-slate-50"
            >
              Level Pass: exam details
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Access expires two weeks after your exam window month ends. Choose the level and window you&apos;re
              registering for.
            </p>
            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="lp-level" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                  CFA level
                </label>
                <select
                  id="lp-level"
                  name="level"
                  value={level}
                  onChange={(e) => setLevel(e.target.value as (typeof LEVELS)[number])}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                >
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      Level {l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="lp-window"
                  className="block text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Exam window
                </label>
                <select
                  id="lp-window"
                  name="examWindow"
                  value={examWindow}
                  onChange={(e) => setExamWindow(e.target.value as ExamWindow)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                >
                  {WINDOWS.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="lp-year" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Exam year
                </label>
                <select
                  id="lp-year"
                  name="examYear"
                  value={examYear}
                  onChange={(e) => setExamYear(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                >
                  {yearOptions().map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {error ? (
              <p className="mt-4 text-sm text-rose-600 dark:text-rose-400" role="alert">
                {error}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void startCheckout()}
                disabled={loading}
                className="inline-flex min-h-[2.75rem] flex-1 items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-accent hover:text-accent-foreground disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-accent dark:hover:text-accent-foreground"
              >
                {loading ? "Redirecting…" : "Continue to checkout"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
