"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPublicSiteOrigin } from "@/lib/site";
import { Events, track, referrerSource } from "@/lib/analytics";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "azure" | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    const reason = params.get("reason");
    if (!err) return;
    setError(reason?.trim() ? reason : err);
    const u = new URL(window.location.href);
    u.searchParams.delete("error");
    u.searchParams.delete("reason");
    window.history.replaceState({}, "", u.toString());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!privacyAccepted) {
      setError("Please accept the privacy policy to continue.");
      return;
    }
    setLoading(true);

    try {
      const supabase = createClient();
      const trimmedFirstName = firstName.trim();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${getPublicSiteOrigin()}/login`,
          data: {
            first_name: trimmedFirstName
          }
        }
      });

      setLoading(false);

      if (signUpError) {
        const err = signUpError as {
          message: string;
          code?: string;
          status?: number;
          details?: string;
        };
        console.error("[register] supabase.auth.signUp failed — full error object:", signUpError);
        console.error("[register] message:", err.message);
        console.error("[register] code:", err.code);
        console.error("[register] status:", err.status);
        if (err.details != null && err.details !== "") {
          console.error("[register] details:", err.details);
        }
        setError(signUpError.message);
        return;
      }

      track(Events.signup, {
        provider: "email",
        referrer_source: referrerSource(),
        plan_tier: "free",
      });

      if (data.session) {
        window.location.href = "/app";
        return;
      }

      setInfo("Check your email for a confirmation link, then sign in.");
    } catch (err) {
      console.error("[register] unexpected error during signUp:", err);
      setError("Something went wrong.");
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "azure") => {
    setError(null);
    setInfo(null);
    if (!privacyAccepted) {
      setError("Please accept the privacy policy to continue.");
      return;
    }
    setOauthLoading(provider);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/app`;

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });

    if (oauthError) {
      setError(oauthError.message);
      setOauthLoading(null);
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
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200/90 bg-slate-50/60 px-3.5 py-3 text-sm leading-relaxed text-slate-700 transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:border-slate-600">
        <input
          type="checkbox"
          checked={privacyAccepted}
          onChange={(e) => setPrivacyAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-accent focus:ring-2 focus:ring-accent focus:ring-offset-0 dark:border-slate-600 dark:bg-slate-900"
          aria-describedby="privacy-accept-hint"
        />
        <span id="privacy-accept-hint">
          I&apos;ve read and accept the{" "}
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
          >
            privacy policy
          </Link>
          .
        </span>
      </label>

      <div className="space-y-3">
        {!privacyAccepted ? (
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Accept the privacy policy above to continue.
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => handleOAuth("azure")}
          disabled={loading || oauthLoading != null || !privacyAccepted}
          className="min-h-[2.75rem] w-full touch-manipulation rounded-full bg-slate-900 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 [-webkit-tap-highlight-color:transparent] dark:bg-white dark:text-slate-950 dark:hover:bg-stone-200"
        >
          {oauthLoading === "azure" ? "Connecting…" : "Continue with Microsoft"}
        </button>
        <button
          type="button"
          onClick={() => handleOAuth("google")}
          disabled={loading || oauthLoading != null || !privacyAccepted}
          className="min-h-[2.75rem] w-full touch-manipulation rounded-full bg-slate-900 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 [-webkit-tap-highlight-color:transparent] dark:bg-white dark:text-slate-950 dark:hover:bg-stone-200"
        >
          {oauthLoading === "google" ? "Connecting…" : "Continue with Google"}
        </button>
      </div>

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs font-medium uppercase tracking-wide text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            Or
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-rose-200/90 bg-rose-50/90 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </div>
        )}
        {info && (
          <div className="rounded-lg border border-sky-200/90 bg-sky-50/90 px-4 py-3 text-sm text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-100">
            {info}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            First name
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="min-h-[2.75rem] w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:border-slate-500 sm:text-sm"
            required
            minLength={1}
            maxLength={50}
            autoComplete="given-name"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            So we can address you like a person, not a user ID.
          </p>
        </div>

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
            className="min-h-[2.75rem] w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:border-slate-500 sm:text-sm"
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
          disabled={loading || !privacyAccepted}
          className="min-h-[2.75rem] w-full touch-manipulation rounded-full bg-slate-900 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 [-webkit-tap-highlight-color:transparent] dark:bg-white dark:text-slate-950 dark:hover:bg-stone-200"
        >
          {loading ? "Creating account…" : "Create account"}
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
