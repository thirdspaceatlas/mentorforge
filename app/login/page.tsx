"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/app"
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }

    window.location.href = res?.url ?? "/app";
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center space-y-8 py-12 sm:min-h-[65vh] sm:py-16">
      <div className="text-center">
        <h1 className="font-display text-3xl font-medium tracking-tight text-slate-900 dark:text-slate-50">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Sign in to open your study planner.
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
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-[2.75rem] w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:border-slate-500 sm:text-sm"
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:border-slate-500"
            required
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="min-h-[2.75rem] w-full touch-manipulation rounded-full bg-slate-900 py-3 text-sm font-medium text-white transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50 [-webkit-tap-highlight-color:transparent] dark:bg-white dark:text-slate-950 dark:hover:bg-accent dark:hover:text-accent-foreground"
        >
          {loading ? "Signing in\u2026" : "Sign in"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-600 dark:text-slate-200 dark:decoration-slate-600 dark:hover:decoration-slate-400"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
