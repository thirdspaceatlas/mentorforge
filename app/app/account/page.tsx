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

export default function AccountPage() {
  const { user, loading: userLoading } = useSupabaseUser();
  const plan = usePlan();
  const router = useRouter();

  const [calendars, setCalendars] = useState<CalendarConnection[]>([]);
  const [studyPlan, setStudyPlan] = useState<StudyPlanInfo>(null);
  const [loading, setLoading] = useState(true);
  const [resetConfirm, setResetConfirm] = useState("");
  const [calendarResetConfirm, setCalendarResetConfirm] = useState("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch("/api/calendar/connections").then((r) => r.ok ? r.json() : { connections: [] }),
      fetch("/api/study-plan").then((r) => r.ok ? r.json() : { plan: null }),
    ])
      .then(([calData, planData]) => {
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
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  const tierLabel = plan.plan === "all_access" ? "All Access" : plan.plan === "level_pass" ? "Level Pass" : "Free";
  const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
    setResetting(true);
    // Delete all connections (cascade deletes events, windows, sessions)
    for (const cal of calendars) {
      await fetch("/api/calendar/connections", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ connectionId: cal.id }) });
    }
    setCalendars([]);
    setCalendarResetConfirm("");
    setResetting(false);
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
            Disconnects all calendars and clears all study sessions, windows, and sync data. Your study plan stays intact.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="text"
              placeholder='Type "reset" to confirm'
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
    </div>
  );
}
