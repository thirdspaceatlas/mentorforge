"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    window.location.href = "/app";
  };

  return (
    <div className="relative left-1/2 -my-8 -ml-[50vw] flex min-h-[calc(100vh-3.65rem)] w-screen flex-col justify-center bg-paper px-4 py-12 sm:-my-14 sm:px-8 sm:py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col space-y-8">
      <div className="text-center">
        <h1 className="font-display text-3xl font-medium tracking-tight text-slate-900 dark:text-slate-50">
          Choose a new password
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Enter a new password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-rose-200/90 bg-rose-50/90 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="min-h-[2.75rem] w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:border-slate-500 sm:text-sm"
            required
            minLength={8}
            autoComplete="new-password"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">At least 8 characters.</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="min-h-[2.75rem] w-full touch-manipulation rounded-full bg-slate-900 py-3 text-sm font-medium text-white transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50 [-webkit-tap-highlight-color:transparent] dark:bg-white dark:text-slate-950 dark:hover:bg-accent dark:hover:text-accent-foreground"
        >
          {loading ? "Updating\u2026" : "Update password"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        <Link
          href="/login"
          className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-600 dark:text-slate-200 dark:decoration-slate-600 dark:hover:decoration-slate-400"
        >
          Back to sign in
        </Link>
      </p>
      </div>
    </div>
  );
}
