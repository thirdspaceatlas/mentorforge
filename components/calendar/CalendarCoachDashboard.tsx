"use client";

import { useEffect, useRef, useState } from "react";
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

type CalendarCoachDashboardProps = {
  calendarPreferredSessionMin: number;
  onCalendarPreferredSessionMinChange: (n: number) => void | Promise<void>;
};

export function CalendarCoachDashboard({
  calendarPreferredSessionMin,
  onCalendarPreferredSessionMinChange,
}: CalendarCoachDashboardProps) {
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
          <AdHocButton preferredMin={calendarPreferredSessionMin} />
          {stats.calendarsConnected > 0 && (
            <CalendarStatus count={stats.calendarsConnected} />
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
        <AllDoneCard
          minutesToday={stats.minutesToday}
          calendarsConnected={stats.calendarsConnected}
          preferredMin={calendarPreferredSessionMin}
        />
      )}
      {nextWindow && (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
          <PreferredSessionControl
            value={calendarPreferredSessionMin}
            onChange={onCalendarPreferredSessionMinChange}
          />
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
            <CalendarStatus count={stats.calendarsConnected} />
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

function PreferredSessionControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void | Promise<void>;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);

  return (
    <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-left dark:border-slate-600 dark:bg-slate-800/50">
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
        Default session length (splits open calendar time into chunks this size)
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <input
          type="range"
          min={5}
          max={180}
          step={1}
          value={local}
          onChange={(e) => setLocal(Number(e.target.value))}
          onMouseUp={() => onChange(local)}
          onTouchEnd={() => onChange(local)}
          className="min-w-[140px] flex-1 accent-sky-500"
          aria-valuemin={5}
          aria-valuemax={180}
          aria-valuenow={local}
        />
        <span className="text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-100">
          {local} min
        </span>
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
        When you start a session, you can shorten it (e.g. 6 or 20 minutes) up to the available window.
      </p>
    </div>
  );
}

function AdHocButton({ preferredMin }: { preferredMin: number }) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [durationMin, setDurationMin] = useState(() =>
    Math.min(180, Math.max(5, preferredMin))
  );

  useEffect(() => {
    setDurationMin((d) => Math.min(180, Math.max(5, preferredMin, d)));
  }, [preferredMin]);

  return (
    <div className="mt-4 space-y-2">
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
        Session length
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="range"
          min={5}
          max={180}
          step={1}
          value={durationMin}
          onChange={(e) => setDurationMin(Number(e.target.value))}
          className="min-w-[140px] flex-1 accent-sky-500"
        />
        <span className="text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-100">
          {durationMin} min
        </span>
      </div>
      <button
        type="button"
        onClick={async () => {
          setStarting(true);
          try {
            const res = await fetch("/api/calendar/sessions/ad-hoc", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ durationMin }),
            });
            if (!res.ok) throw new Error();
            const { windowId } = await res.json();
            router.push(`/app/session/${windowId}`);
          } catch {
            setStarting(false);
          }
        }}
        disabled={starting}
        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md bg-sky-500 px-5 py-2.5 text-sm font-semibold text-sky-950 transition-colors hover:bg-sky-400 disabled:opacity-60 [-webkit-tap-highlight-color:transparent]"
      >
        {starting ? "Starting..." : "Start a study session"}
      </button>
    </div>
  );
}

function AllDoneCard({
  minutesToday,
  calendarsConnected,
  preferredMin,
}: {
  minutesToday: number;
  calendarsConnected: number;
  preferredMin: number;
}) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [durationMin, setDurationMin] = useState(() =>
    Math.min(180, Math.max(5, preferredMin))
  );

  useEffect(() => {
    setDurationMin((d) => Math.min(180, Math.max(5, preferredMin, d)));
  }, [preferredMin]);

  const startAdHoc = async () => {
    setStarting(true);
    try {
      const res = await fetch("/api/calendar/sessions/ad-hoc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMin }),
      });
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
      <div className="mt-4 space-y-2">
        <label className="block text-xs font-medium text-emerald-800 dark:text-emerald-300">
          Next session length
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="range"
            min={5}
            max={180}
            step={1}
            value={durationMin}
            onChange={(e) => setDurationMin(Number(e.target.value))}
            className="min-w-[140px] flex-1 accent-emerald-500"
          />
          <span className="text-sm font-semibold tabular-nums text-emerald-900 dark:text-emerald-200">
            {durationMin} min
          </span>
        </div>
      </div>
      <button
        onClick={startAdHoc}
        disabled={starting}
        className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400 disabled:opacity-60 [-webkit-tap-highlight-color:transparent]"
      >
        {starting ? "Starting..." : "Start another session"}
      </button>
      {calendarsConnected > 0 && (
        <CalendarStatus count={calendarsConnected} />
      )}
      <ForecastCard />
    </div>
  );
}

function ForecastCard() {
  const [days, setDays] = useState(1);
  const [forecast, setForecast] = useState<{ date: string; dayLabel: string; windowCount: number; totalMin: number }[] | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  // Load saved preference on mount
  useEffect(() => {
    fetch("/api/study-plan")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.plan?.forecastDays) {
          setDays(data.plan.forecastDays);
        }
        initializedRef.current = true;
      })
      .catch(() => { initializedRef.current = true; });
  }, []);

  // Fetch forecast when days changes
  useEffect(() => {
    if (!initializedRef.current) return;
    setLoading(true);
    fetch(`/api/calendar/forecast?days=${days}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.forecast) setForecast(data.forecast);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  const switchDays = (n: number) => {
    setDays(n);
    // Save preference (fire-and-forget)
    fetch("/api/study-plan")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.plan) return;
        fetch("/api/study-plan", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data.plan, forecastDays: n }),
        }).catch(() => {});
      })
      .catch(() => {});
  };

  return (
    <div className="mt-6 border-t border-emerald-200/60 pt-5 dark:border-emerald-900/30">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Coming up
        </h3>
        <div
          role="group"
          aria-label="Forecast range"
          className="inline-flex rounded-md border border-slate-300 bg-slate-50 p-0.5 dark:border-slate-600 dark:bg-slate-900/80"
        >
          {([1, 3, 5] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => switchDays(n)}
              aria-pressed={days === n}
              className={
                "min-w-[4rem] rounded px-2.5 py-1.5 text-xs font-medium transition-colors [-webkit-tap-highlight-color:transparent] " +
                (days === n
                  ? "bg-sky-500 text-slate-950"
                  : "text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800")
              }
            >
              {n === 1 ? "Tomorrow" : `${n} Days`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-3 space-y-2">
          {Array.from({ length: days }).map((_, i) => (
            <div key={i} className="h-5 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      ) : forecast && forecast.length > 0 ? (
        <div className="mt-3 space-y-1.5">
          {forecast.map((day) => (
            <div key={day.date} className="flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">{day.dayLabel}</span>
              <span className="text-slate-500 dark:text-slate-400">
                {day.windowCount > 0
                  ? `${day.windowCount} window${day.windowCount > 1 ? "s" : ""} · ~${day.totalMin} min`
                  : "Free day — start a session anytime"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          No calendar data yet for upcoming days.
        </p>
      )}
    </div>
  );
}

function CalendarStatus({ count }: { count: number }) {
  const [open, setOpen] = useState(false);
  const [showTip, setShowTip] = useState(false);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {count} calendar{count > 1 ? "s" : ""} synced
      </span>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="font-medium text-sky-500 transition-colors hover:text-sky-400"
        >
          + Add calendar
        </button>
      ) : (
        <span className="flex items-center gap-2">
          <a href="/api/calendar/oauth/google?returnTo=/app" className="font-medium text-sky-500 transition-colors hover:text-sky-400">Google</a>
          <a href="/api/calendar/oauth/outlook?returnTo=/app" className="font-medium text-sky-500 transition-colors hover:text-sky-400">Outlook</a>
        </span>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowTip(!showTip)}
          aria-label="Why connect multiple calendars?"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[10px] font-bold text-slate-400 transition-colors hover:border-sky-400 hover:text-sky-500 dark:border-slate-600 dark:hover:border-sky-500"
        >
          ?
        </button>
        {showTip && (
          <div className="absolute bottom-7 left-1/2 z-20 w-72 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-lg dark:border-slate-700 dark:bg-slate-800 sm:w-80">
            <button
              type="button"
              onClick={() => setShowTip(false)}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Close"
            >
              &times;
            </button>
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Why multiple calendars?
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Our founder spent 20 years in financial services juggling a locked-down work
              calendar and a personal one. They never synced, and he never wanted to blend
              them ... he didn&apos;t trust that his employer wouldn&apos;t have a way to read
              his personal events. So he kept them separate.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Calendar Coach was built for this. Connect both, and we merge the busy
              times from all your calendars to find the real gaps. No calendar is
              prioritized over another. We never read event titles or details ... just
              free/busy status.
            </p>
          </div>
        )}
      </div>
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
