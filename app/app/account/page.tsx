"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSupabaseUser } from "@/lib/supabase/use-supabase-user";
import { usePlan } from "@/components/app/PlanProvider";
import { createClient } from "@/lib/supabase/client";

type CalendarConnection = {
  id: string;
  provider: string;
  providerEmail: string;
  enabled: boolean;
  createdAt: string;
};

type StudyPlanInfo = {
  examLevel: string;
  examDate: string;
  weeklyHours: number;
  planStartDate: string;
  weekStartDay: string;
} | null;

type UsageSnapshot = {
  plan: "free" | "level_pass" | "all_access";
  calendars: { used: number; cap: number | null };
  rebalances: { used: number; cap: number | null; resetsAt: string };
  nudges: { used: number; cap: number | null; resetsAt: string };
} | null;

export default function AccountPage() {
  const { user, loading: userLoading } = useSupabaseUser();
  const plan = usePlan();
  const router = useRouter();

  const [calendars, setCalendars] = useState<CalendarConnection[]>([]);
  const [studyPlan, setStudyPlan] = useState<StudyPlanInfo>(null);
  const [usage, setUsage] = useState<UsageSnapshot>(null);
  const [loading, setLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [linking, setLinking] = useState<"azure" | "google" | null>(null);
  const [resetConfirm, setResetConfirm] = useState("");
  const [calendarResetConfirm, setCalendarResetConfirm] = useState("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch("/api/calendar/connections").then((r) => r.ok ? r.json() : { connections: [] }),
      fetch("/api/study-plan").then((r) => r.ok ? r.json() : { plan: null }),
      fetch("/api/usage").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([calData, planData, usageData]) => {
        setCalendars(calData.connections || []);
        if (planData.plan) {
          setStudyPlan({
            examLevel: planData.plan.examLevel,
            examDate: planData.plan.examDate,
            weeklyHours: planData.plan.weeklyHours,
            planStartDate: planData.plan.planStartDate,
            weekStartDay: planData.plan.weekStartDay,
          });
        }
        if (usageData) setUsage(usageData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const status = url.searchParams.get("linked");
    const error = url.searchParams.get("error");
    if (status === "1") {
      setAuthMessage("Sign-in method linked.");
      url.searchParams.delete("linked");
      window.history.replaceState({}, "", url.toString());
      return;
    }
    if (error === "oauth") {
      setAuthMessage("Couldn’t link that sign-in method. Please try again.");
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  const tierLabel = plan.plan === "all_access" ? "All Access" : plan.plan === "level_pass" ? "Level Pass" : "Free";
  const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const identities = (user?.identities ?? []).map((i) => i.provider);
  const hasMicrosoft = identities.includes("azure");
  const hasGoogle = identities.includes("google");

  const disconnectCalendar = async (id: string) => {
    await fetch("/api/calendar/connections", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connectionId: id }),
    });
    setCalendars((prev) => prev.filter((c) => c.id !== id));
  };

  const resetStudyPlan = async () => {
    if (resetConfirm !== "reset") return;
    setResetting(true);
    await fetch("/api/study-plan", { method: "DELETE" });
    setStudyPlan(null);
    setResetConfirm("");
    setResetting(false);
    router.push("/app");
  };

  const resetCalendarCoach = async () => {
    if (calendarResetConfirm !== "reset") return;
    const ok = window.confirm(
      "Are you sure you want to reset Calendar Coach?\n\nThis disconnects all calendars and permanently deletes your Calendar Coach history (study windows, sessions, heatmap, and sync data). Your study plan will not be changed."
    );
    if (!ok) return;
    setResetting(true);
    await fetch("/api/calendar/reset", { method: "DELETE" });
    setCalendars([]);
    setCalendarResetConfirm("");
    setResetting(false);
  };

  const linkProvider = async (provider: "azure" | "google") => {
    setAuthMessage(null);
    setLinking(provider);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/app/account?linked=1`;
    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: { redirectTo },
    });
    // On success, we redirect away immediately; only handle errors.
    if (error) {
      setAuthMessage(error.message);
      setLinking(null);
    }
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="font-display text-2xl font-medium tracking-tight text-slate-900 dark:text-slate-50">
        Account
      </h1>

      {/* Account Info */}
      <section className="rounded-xl border border-slate-200/90 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Profile</h2>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Email</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Plan</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">{tierLabel}</span>
          </div>
        </div>

        <div className="mt-5 border-t border-slate-200/60 pt-5 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Linked sign-in methods
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`rounded-full px-2 py-0.5 font-medium ${
                  hasMicrosoft ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                Microsoft
              </span>
              <span
                className={`rounded-full px-2 py-0.5 font-medium ${
                  hasGoogle ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                Google
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Email
              </span>
            </div>
          </div>

          {authMessage && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
              {authMessage}
            </div>
          )}

          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Linking gives you more ways to sign in. Calendar connections are managed separately.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => linkProvider("azure")}
              disabled={hasMicrosoft || linking != null}
              className="rounded-md border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {hasMicrosoft ? "Microsoft linked" : linking === "azure" ? "Linking…" : "Link Microsoft"}
            </button>
            <button
              type="button"
              onClick={() => linkProvider("google")}
              disabled={hasGoogle || linking != null}
              className="rounded-md border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {hasGoogle ? "Google linked" : linking === "google" ? "Linking…" : "Link Google"}
            </button>
          </div>
        </div>

        <button
          onClick={signOut}
          className="mt-5 rounded-md border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Sign out
        </button>
      </section>

      {/* Connected Calendars */}
      <section className="rounded-xl border border-slate-200/90 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Connected Calendars</h2>
        {calendars.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No calendars connected.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {calendars.map((cal) => (
              <div key={cal.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {cal.providerEmail}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {cal.provider === "google" ? "Google Calendar" : "Outlook Calendar"} · Connected {new Date(cal.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => disconnectCalendar(cal.id)}
                  className="shrink-0 text-xs font-medium text-rose-600 transition-colors hover:text-rose-500 dark:text-rose-400"
                >
                  Disconnect
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex items-center gap-3">
          <a href="/api/calendar/oauth/google?returnTo=/app/account" className="text-sm font-medium text-sky-500 transition-colors hover:text-sky-400">
            + Google
          </a>
          <a href="/api/calendar/oauth/outlook?returnTo=/app/account" className="text-sm font-medium text-sky-500 transition-colors hover:text-sky-400">
            + Outlook
          </a>
        </div>
      </section>

      {/* Weekly Usage */}
      {usage && <UsageSection usage={usage} />}

      {/* Study Plan Info */}
      {studyPlan && (
        <section className="rounded-xl border border-slate-200/90 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Study Plan</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Level</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">CFA Level {studyPlan.examLevel}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Exam window</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{studyPlan.examDate}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Weekly hours</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{studyPlan.weeklyHours} hrs/wk</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Week starts</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{weekDays[parseInt(studyPlan.weekStartDay)]}</span>
            </div>
          </div>
          <Link
            href="/app"
            className="mt-4 inline-flex text-sm font-medium text-sky-500 transition-colors hover:text-sky-400"
          >
            Edit plan settings →
          </Link>
        </section>
      )}

      {/* Danger Zone */}
      <section className="rounded-xl border border-rose-200/80 bg-white/90 p-5 shadow-sm dark:border-rose-900/40 dark:bg-slate-900/50 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">Danger Zone</h2>

        {/* Reset Study Plan */}
        <div className="mt-5">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Reset study plan</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Clears your saved plan, weekly progress, and all logged hours. Your calendar connections stay intact.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="text"
              placeholder='Type "reset" to confirm'
              value={resetConfirm}
              onChange={(e) => setResetConfirm(e.target.value)}
              className="w-48 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
            <button
              onClick={resetStudyPlan}
              disabled={resetConfirm !== "reset" || resetting}
              className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-500 disabled:opacity-40"
            >
              Reset plan
            </button>
          </div>
        </div>

        {/* Reset Calendar Coach */}
        <div className="mt-6 border-t border-rose-200/60 pt-5 dark:border-rose-900/30">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Reset Calendar Coach</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Disconnects all calendars and permanently deletes your Calendar Coach history (study windows, sessions, heatmap, and sync data). Your study plan stays intact.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="text"
              placeholder='Type "reset" to confirm (deletes history)'
              value={calendarResetConfirm}
              onChange={(e) => setCalendarResetConfirm(e.target.value)}
              className="w-48 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
            <button
              onClick={resetCalendarCoach}
              disabled={calendarResetConfirm !== "reset" || resetting}
              className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-500 disabled:opacity-40"
            >
              Reset Calendar Coach
            </button>
          </div>
        </div>
      </section>

      <div className="text-center text-xs text-slate-500 dark:text-slate-400">
        Need help? Text us.{" "}
        <a
          href="tel:+16782630101"
          className="font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300"
        >
          (678) 263-0101
        </a>
      </div>
    </div>
  );
}

function formatResetLabel(resetsAt: string): string {
  const date = new Date(resetsAt);
  if (Number.isNaN(date.getTime())) return "";
  const diffDays = Math.max(
    0,
    Math.round((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
  );
  if (diffDays === 0) return "Resets today";
  if (diffDays === 1) return "Resets tomorrow";
  return `Resets in ${diffDays} days`;
}

function UsageRow({
  label,
  used,
  cap,
  reset
}: {
  label: string;
  used: number;
  cap: number | null;
  reset?: string;
}) {
  const unlimited = cap === null;
  const hit = !unlimited && used >= (cap ?? 0);
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(1, cap ?? 1)) * 100));

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-slate-500 dark:text-slate-400">{label}</span>
        <span
          className={
            "font-medium tabular-nums " +
            (hit
              ? "text-rose-600 dark:text-rose-400"
              : "text-slate-900 dark:text-slate-100")
          }
        >
          {unlimited ? "Unlimited" : `${used} of ${cap}`}
        </span>
      </div>
      {unlimited ? null : (
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={
              "h-full rounded-full " +
              (hit ? "bg-rose-500 dark:bg-rose-500" : "bg-accent")
            }
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {reset && !unlimited ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{reset}</p>
      ) : null}
    </div>
  );
}

function UsageSection({ usage }: { usage: NonNullable<UsageSnapshot> }) {
  const nudgeReset = formatResetLabel(usage.nudges.resetsAt);
  const rebalanceReset = formatResetLabel(usage.rebalances.resetsAt);
  const isFree = usage.plan === "free";

  return (
    <section className="rounded-xl border border-slate-200/90 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Usage this week
        </h2>
        {!isFree ? (
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
            All Access — unlimited
          </span>
        ) : null}
      </div>

      <div className="mt-4 space-y-4">
        <UsageRow
          label="Connected calendars"
          used={usage.calendars.used}
          cap={usage.calendars.cap}
        />
        <UsageRow
          label="Calendar Coach nudges"
          used={usage.nudges.used}
          cap={usage.nudges.cap}
          reset={nudgeReset}
        />
        <UsageRow
          label="Smart rebalances"
          used={usage.rebalances.used}
          cap={usage.rebalances.cap}
          reset={rebalanceReset}
        />
      </div>

      {isFree ? (
        <div className="mt-5 border-t border-slate-200/60 pt-4 dark:border-slate-800">
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Free plan caps reset on a rolling 7-day window.{" "}
            <Link
              href="/pricing"
              className="font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
            >
              Upgrade to All Access
            </Link>{" "}
            for unlimited everything.
          </p>
        </div>
      ) : null}
    </section>
  );
}
