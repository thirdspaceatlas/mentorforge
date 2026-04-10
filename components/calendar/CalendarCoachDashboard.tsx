"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Calendar Coach dashboard section — renders above the study planner.
 * Fetches real data from GET /api/calendar/stats.
 */

type StudyType = "review" | "new" | "practice";
type WindowStatus = "done" | "current" | "upcoming";

type DashWindow = {
  id: string;
  topicName: string | null;
  studyType: string | null;
  startTime: string;
  durationMin: number;
  status: WindowStatus;
};

type HeatmapDay = { date: string; minutes: number };

type DashStats = {
  minutesToday: number;
  pacePercent: number;
  daysToExam: number;
  calendarsConnected: number;
  todayWindows: DashWindow[];
  nextWindow: DashWindow | null;
  heatmap: HeatmapDay[];
};

export function CalendarCoachDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/calendar/stats")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((data) => setStats(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="mb-8" aria-label="Calendar Coach">
        <div className="animate-pulse rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-3 h-3 w-32 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="mb-2 h-6 w-64 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </section>
    );
  }

  // Show onboarding prompt on error (API may fail if tables are new) or no connections
  if (error || !stats || stats.calendarsConnected === 0) {
    return (
      <section className="mb-8" aria-label="Calendar Coach">
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
            Connect your calendar to get started
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Calendar Coach finds study windows in your real schedule.
          </p>
          <button
            onClick={() => router.push("/app/onboarding")}
            className="mt-4 inline-flex min-h-[44px] items-center rounded-md bg-sky-500 px-5 py-2.5 text-sm font-semibold text-sky-950 transition-colors hover:bg-sky-400"
          >
            Set up Calendar Coach
          </button>
        </div>
      </section>
    );
  }

  // Empty state: calendars connected but no windows today
  if (stats.todayWindows.length === 0) {
    return (
      <section className="mb-8" aria-label="Calendar Coach">
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <p className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
            No study windows found today.
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Your calendar looks full, but you can still start a session anytime.
          </p>
          <AdHocButton />
          {stats.calendarsConnected > 0 && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {stats.calendarsConnected} calendar{stats.calendarsConnected > 1 ? "s" : ""} synced
            </p>
          )}
        </div>
        <Heatmap heatmap={stats.heatmap} />
      </section>
    );
  }

  const { nextWindow, todayWindows, heatmap } = stats;
  const allDone = todayWindows.length > 0 && !nextWindow;

  return (
    <section className="mb-8" aria-label="Calendar Coach">
      {/* Hero Card */}
      {allDone && (
        <AllDoneCard minutesToday={stats.minutesToday} calendarsConnected={stats.calendarsConnected} />
      )}
      {nextWindow && (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-500 dark:text-sky-400">
            Next study window
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-slate-900 dark:text-slate-100">
            {nextWindow.topicName || "Study session"}
          </h2>
          <div className="mt-1 flex items-center gap-2.5">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {nextWindow.durationMin} min &middot; starts at{" "}
              {new Date(nextWindow.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </span>
            {nextWindow.studyType && (
              <TypeBadge type={nextWindow.studyType as StudyType} />
            )}
          </div>
          <button
            onClick={() => router.push(`/app/session/${nextWindow.id}`)}
            className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-md bg-sky-500 px-5 py-2.5 text-sm font-semibold text-sky-950 transition-colors hover:bg-sky-400 [-webkit-tap-highlight-color:transparent]"
          >
            Go
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </button>

          {/* Stats */}
          <div className="mt-4 border-t border-slate-200 pt-3.5 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-slate-100">{stats.minutesToday} min</span> today
              {stats.pacePercent > 0 && (
                <>
                  <span className="mx-1 text-slate-300 dark:text-slate-600">&middot;</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{stats.pacePercent}%</span> on pace
                </>
              )}
              {stats.daysToExam > 0 && (
                <>
                  <span className="mx-1 text-slate-300 dark:text-slate-600">&middot;</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{stats.daysToExam} days</span> to exam
                </>
              )}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {stats.calendarsConnected} calendar{stats.calendarsConnected > 1 ? "s" : ""} synced
            </p>
          </div>
        </div>
      )}

      {/* Today's Timeline */}
      <div className="mt-8">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Today
        </h3>
        <div className="flex flex-col" role="list">
          {todayWindows.map((w, i) => (
            <div key={w.id} className="relative flex items-start gap-3 py-2.5" role="listitem">
              {i < todayWindows.length - 1 && (
                <div className="absolute left-[11px] top-9 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
              )}
              <TimelineDot status={w.status} />
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${w.status === "done" ? "text-slate-400 dark:text-slate-500" : "text-slate-900 dark:text-slate-100"}`}>
                  {w.topicName || "Study session"}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {new Date(w.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} &middot; {w.durationMin} min
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Heatmap heatmap={heatmap} />
    </section>
  );
}

/* ─── Sub-components ─── */

function AdHocButton() {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  return (
    <button
      onClick={async () => {
        setStarting(true);
        try {
          const res = await fetch("/api/calendar/sessions/ad-hoc", { method: "POST" });
          if (!res.ok) throw new Error();
          const { windowId } = await res.json();
          router.push(`/app/session/${windowId}`);
        } catch {
          setStarting(false);
        }
      }}
      disabled={starting}
      className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-md bg-sky-500 px-5 py-2.5 text-sm font-semibold text-sky-950 transition-colors hover:bg-sky-400 disabled:opacity-60 [-webkit-tap-highlight-color:transparent]"
    >
      {starting ? "Starting..." : "Start a study session"}
    </button>
  );
}

function AllDoneCard({ minutesToday, calendarsConnected }: { minutesToday: number; calendarsConnected: number }) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  const startAdHoc = async () => {
    setStarting(true);
    try {
      const res = await fetch("/api/calendar/sessions/ad-hoc", { method: "POST" });
      if (!res.ok) throw new Error();
      const { windowId } = await res.json();
      router.push(`/app/session/${windowId}`);
    } catch {
      setStarting(false);
    }
  };

  return (
    <div className="rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-slate-900 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
        All done for today
      </p>
      <p className="mt-2 font-display text-xl font-semibold text-slate-900 dark:text-slate-100">
        Nice work — {minutesToday} min logged today.
      </p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Want to keep going? Start an extra session anytime.
      </p>
      <button
        onClick={startAdHoc}
        disabled={starting}
        className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400 disabled:opacity-60 [-webkit-tap-highlight-color:transparent]"
      >
        {starting ? "Starting..." : "Start another session"}
      </button>
      {calendarsConnected > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {calendarsConnected} calendar{calendarsConnected > 1 ? "s" : ""} synced
        </p>
      )}
    </div>
  );
}

function Heatmap({ heatmap }: { heatmap: HeatmapDay[] }) {
  if (heatmap.length === 0) return null;
  const daysWithStudy = heatmap.filter((d) => d.minutes > 0).length;

  return (
    <div className="mt-8">
      <h3 className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Last 14 days
      </h3>
      <div className="flex flex-col items-center">
        <div className="mb-1 grid w-full max-w-[320px] grid-cols-7 gap-1">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={i} className="text-center text-[10px] font-medium text-slate-400">{d}</span>
          ))}
        </div>
        <div
          className="grid w-full max-w-[320px] grid-cols-7 gap-1"
          role="img"
          aria-label={`Activity heatmap showing ${daysWithStudy} of 14 days with study sessions`}
        >
          {heatmap.map((day) => (
            <div key={day.date} className={`aspect-square rounded ${heatmapColor(day.minutes)}`} aria-label={`${day.date}, ${day.minutes} minutes`} />
          ))}
        </div>
        <p className="mt-3 text-center text-sm text-slate-500 dark:text-slate-400">
          You&apos;ve studied {daysWithStudy} of the last 14 days.
        </p>
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: StudyType }) {
  const styles: Record<StudyType, string> = {
    review: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
    new: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
    practice: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[type]}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
}

function TimelineDot({ status }: { status: WindowStatus }) {
  if (status === "done") {
    return (
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-500">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 7l3 3 5-5" /></svg>
      </div>
    );
  }
  if (status === "current") {
    return (
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-500 ring-[3px] ring-amber-500/15 dark:bg-amber-500/15">
        <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="currentColor" /></svg>
      </div>
    );
  }
  return (
    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
      <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
    </div>
  );
}

function heatmapColor(minutes: number): string {
  if (minutes === 0) return "bg-slate-100 dark:bg-[#283548]";
  if (minutes <= 8) return "bg-sky-300 dark:bg-sky-700";
  if (minutes <= 18) return "bg-sky-400 dark:bg-sky-600";
  if (minutes <= 30) return "bg-sky-500 dark:bg-sky-500";
  return "bg-sky-600 dark:bg-sky-400";
}
