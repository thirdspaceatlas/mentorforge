"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
        setLoading(false);
        return;
      }

      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/app"
      });

      setLoading(false);

      if (signInRes?.error) {
        setError("Account created. Please sign in manually.");
        return;
      }

      window.location.href = signInRes?.url ?? "/app";
    } catch {
      setError("Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm space-y-8 pt-8 sm:pt-12">
      <div className="text-center">
        <h1 className="font-display text-3xl font-medium tracking-tight text-slate-900 dark:text-slate-50">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Open the planner to build and rebalance your CFA study runway.
        </p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Planning and pacing software—not tutoring or a coach marketplace.
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
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:border-slate-500"
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
            minLength={8}
            autoComplete="new-password"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            At least 8 characters.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-slate-900 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-stone-200"
        >
          {loading ? "Creating account\u2026" : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-600 dark:text-slate-200 dark:decoration-slate-600 dark:hover:decoration-slate-400"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
