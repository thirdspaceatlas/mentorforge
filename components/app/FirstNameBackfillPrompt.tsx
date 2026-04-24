"use client";

import { useEffect, useState } from "react";

/**
 * Lightweight backfill prompt for users who signed up before firstName was required.
 * Fetches the current user's firstName once on mount; if null, shows a one-field
 * modal so we can greet them properly in email and in-app copy.
 *
 * Dismissing sets a session-scoped flag so the modal doesn't re-pop within the
 * same tab session, but it returns on a fresh session until answered.
 */

const DISMISS_KEY = "mf:firstNameBackfill:dismissedAt";
const DISMISS_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

export function FirstNameBackfillPrompt() {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Honor a recent dismissal so the modal isn't annoying within a day.
        if (typeof window !== "undefined") {
          const raw = window.localStorage.getItem(DISMISS_KEY);
          if (raw) {
            const dismissedAt = Number(raw);
            if (
              Number.isFinite(dismissedAt) &&
              Date.now() - dismissedAt < DISMISS_WINDOW_MS
            ) {
              return;
            }
          }
        }

        const res = await fetch("/api/profile/first-name");
        if (!res.ok) return;
        const data = (await res.json()) as { firstName: string | null };
        if (!cancelled && data.firstName == null) {
          setOpen(true);
        }
      } catch {
        // Silent — this is a nudge, not critical.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    const trimmed = firstName.trim();
    if (trimmed.length === 0) {
      setError("Please enter a name.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/first-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: trimmed })
      });
      if (!res.ok) {
        setError("Couldn't save — try again in a moment.");
        setSaving(false);
        return;
      }
      setOpen(false);
    } catch {
      setError("Couldn't reach the server. Check your connection.");
      setSaving(false);
    }
  }

  function dismiss() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="firstname-backfill-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-[2px]"
    >
      <div className="w-full max-w-sm rounded-2xl border border-slate-200/95 bg-white p-6 shadow-xl dark:border-slate-700/80 dark:bg-[#0f1520] sm:p-7">
        <p className="font-display text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Welcome back
        </p>
        <h2
          id="firstname-backfill-title"
          className="mt-2 font-display text-[1.35rem] font-medium leading-tight tracking-tight text-slate-900 dark:text-slate-50 sm:text-[1.45rem]"
        >
          What should we call you?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Just your first name — so emails don&apos;t read like they&apos;re from a stranger.
        </p>

        <div className="mt-5 space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            First name
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            maxLength={50}
            autoComplete="given-name"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && !saving) {
                e.preventDefault();
                void save();
              }
            }}
            className="min-h-[2.75rem] w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 outline-none focus:border-accent focus:ring-1 focus:ring-accent dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 sm:text-sm"
          />
          {error ? (
            <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={dismiss}
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || firstName.trim().length === 0}
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
