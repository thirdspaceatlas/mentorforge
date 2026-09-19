"use client";

import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const DISMISS_KEY = "waitlist_dismissed";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function AppWaitlistBanner() {
  const pathname = usePathname();
  const isAppRoute = pathname?.startsWith("/app") ?? false;

  const [hydrated, setHydrated] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    setHydrated(true);
  }, []);

  if (!hydrated || dismissed || isAppRoute) {
    return null;
  }

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error: insertError } = await supabase.from("waitlist").insert({
        email: trimmed.toLowerCase()
      });

      if (insertError) {
        // Treat duplicate signups as success for a smoother UX.
        const duplicate =
          insertError.code === "23505" ||
          insertError.message.toLowerCase().includes("duplicate");
        if (!duplicate) {
          setError("Something went wrong. Please try again.");
          return;
        }
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="border-b border-slate-200/90 bg-slate-100/90 dark:border-slate-800/80 dark:bg-slate-900/90"
      role="region"
      aria-label="Mobile app waitlist"
    >
      <div className="mx-auto flex max-w-[1200px] gap-2 px-4 py-3 sm:items-center sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <p className="min-w-0 flex-1 text-sm leading-snug text-slate-700 dark:text-slate-200">
            📱 The MentorForge app is coming to iOS and Android. Join the waitlist if you want first
            in line.
          </p>

          {submitted ? (
            <p
              className="shrink-0 text-sm font-medium text-emerald-700 dark:text-emerald-400"
              role="status"
              aria-live="polite"
            >
              You&apos;re on the list!
            </p>
          ) : (
            <form
              onSubmit={onSubmit}
              className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center"
            >
              <label className="sr-only" htmlFor="waitlist-email">
                Email for app waitlist
              </label>
              <input
                id="waitlist-email"
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                disabled={submitting}
                className="min-h-[2.75rem] w-full min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:ring-emerald-400 dark:focus-visible:ring-offset-slate-900 sm:min-w-[12rem] sm:max-w-xs"
              />
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-[2.75rem] shrink-0 touch-manipulation items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:focus-visible:ring-emerald-400 dark:focus-visible:ring-offset-slate-900 [-webkit-tap-highlight-color:transparent]"
              >
                {submitting ? "Saving…" : "Notify me"}
              </button>
            </form>
          )}

          {error ? (
            <p className="text-xs text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="inline-flex min-h-[2.75rem] min-w-[2.75rem] shrink-0 items-center justify-center self-start rounded-lg text-slate-500 transition-colors hover:bg-slate-200/80 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 sm:self-center [-webkit-tap-highlight-color:transparent]"
          aria-label="Dismiss waitlist banner"
        >
          <span aria-hidden className="text-lg leading-none">
            ×
          </span>
        </button>
      </div>
    </div>
  );
}
