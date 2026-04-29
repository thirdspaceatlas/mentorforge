"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DayRibbon } from "./DayRibbon";
import { RecentConsistencyBars } from "./RecentConsistencyBars";
import { TrendsDisclosure } from "./TrendsDisclosure";

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
            className="mt-4 inline-flex min-h-[44px] items-center rounded-md bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400"
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
        <TrendsDisclosure>
          <RecentConsistencyBars days={stats.heatmap} />
        </TrendsDisclosure>
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
        <HeroNextSession
          nextWindow={nextWindow}
          todayWindows={todayWindows}
          minutesToday={stats.minutesToday}
          pacePercent={stats.pacePercent}
          daysToExam={stats.daysToExam}
          calendarsConnected={stats.calendarsConnected}
          calendarPreferredSessionMin={calendarPreferredSessionMin}
          onCalendarPreferredSessionMinChange={onCalendarPreferredSessionMinChange}
          onBegin={() => router.push(`/app/session/${nextWindow.id}`)}
        />
      )}

      {/* Today's docket — editorial header + DayRibbon (≥sm) / vertical list (<sm) */}
      <TodaysDocket
        windows={todayWindows}
        nextWindow={nextWindow}
        minutesToday={stats.minutesToday}
      />

      <TrendsDisclosure>
        <RecentConsistencyBars days={heatmap} />
      </TrendsDisclosure>
    </section>
  );
}

/* ─── Sub-components ─── */

export function HeroNextSession({
  nextWindow,
  todayWindows,
  minutesToday,
  pacePercent,
  daysToExam,
  calendarsConnected,
  calendarPreferredSessionMin,
  onCalendarPreferredSessionMinChange,
  onBegin,
}: {
  nextWindow: DashWindow;
  todayWindows: DashWindow[];
  minutesToday: number;
  pacePercent: number;
  daysToExam: number;
  calendarsConnected: number;
  calendarPreferredSessionMin: number;
  onCalendarPreferredSessionMinChange: (n: number) => void | Promise<void>;
  onBegin: () => void;
}) {
  const totalPlannedMin = todayWindows.reduce((s, w) => s + w.durationMin, 0);
  const donePct =
    totalPlannedMin > 0
      ? Math.min(100, Math.round((minutesToday / totalPlannedMin) * 100))
      : 0;
  const doneCount = todayWindows.filter((w) => w.status === "done").length;
  const startTime = new Date(nextWindow.startTime).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="relative overflow-hidden rounded-2xl border border-hair bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-9">
      {/* Editorial date stamp — absolute top-right */}
      <div
        className="pointer-events-none absolute right-5 top-5 hidden font-mono text-[10px] uppercase tracking-[0.1em] text-slate-500 dark:text-slate-500 sm:block"
        aria-hidden
      >
        {formatStampDate(new Date())}
      </div>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-7">
        <div className="min-w-0 flex-1">
          {/* Eyebrow — amber rule + uppercase tracked */}
          <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-amber-mf">
            <span aria-hidden className="inline-block h-px w-4 bg-amber-mf" />
            Next study session
          </p>

          {/* Title — Fraunces, ink */}
          <h2 className="mt-2.5 font-display text-3xl font-medium leading-[1.05] tracking-tight text-ink dark:text-slate-100 sm:text-4xl">
            {nextWindow.topicName || "Study session"}
            <span className="text-slate-400 dark:text-slate-500">.</span>
          </h2>

          {/* Meta — clock icon + mono timestamp */}
          <div className="mt-3 flex flex-wrap items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
            <svg
              width="13"
              height="13"
              viewBox="0 0 13 13"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className="shrink-0"
            >
              <circle cx="6.5" cy="6.5" r="5.25" />
              <path d="M6.5 3.5v3l2 1.25" />
            </svg>
            <span>
              <span className="font-medium tabular-nums">{nextWindow.durationMin} min</span>
              <span className="mx-1.5 text-slate-300 dark:text-slate-600">&middot;</span>
              starts <span className="font-mono tabular-nums">{startTime}</span>
            </span>
            {nextWindow.studyType && (
              <TypeBadge type={nextWindow.studyType as StudyType} />
            )}
          </div>
        </div>

        {/* Begin button — emerald primary, pill */}
        <button
          onClick={onBegin}
          className="inline-flex min-h-[44px] items-center gap-2 self-start rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgb(4_120_87_/_0.25)] transition-colors hover:bg-emerald-800 [-webkit-tap-highlight-color:transparent] dark:bg-emerald-500 dark:text-emerald-950 dark:shadow-[0_4px_14px_rgb(16_185_129_/_0.3)] dark:hover:bg-emerald-400 sm:self-auto"
        >
          Begin session
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M2.5 7h9M8 3l4 4-4 4" />
          </svg>
        </button>
      </div>

      {/* Today's allocation strip */}
      {totalPlannedMin > 0 && (
        <div className="mt-7 border-t border-hair pt-5 dark:border-slate-700">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
              Today&apos;s allocation
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="font-display text-base font-medium text-ink dark:text-slate-100">
                {formatHM(minutesToday)}
              </span>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                / {formatHM(totalPlannedMin)}
              </span>
            </span>
          </div>

          {/* Track */}
          <div
            className="relative mt-3 h-2 overflow-visible rounded bg-paper dark:bg-slate-800"
            role="progressbar"
            aria-valuenow={donePct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Today's study allocation"
          >
            <div
              className="h-full rounded bg-ink dark:bg-slate-200"
              style={{ width: `${donePct}%` }}
            />
            {donePct < 100 && (
              <div
                className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white bg-amber-mf shadow-[0_2px_6px_rgb(201_132_43_/_0.4)] dark:border-slate-900"
                style={{ left: `calc(${donePct}% - 7px)` }}
                aria-hidden
              />
            )}
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="inline-block h-2 w-2 bg-ink dark:bg-slate-200" />
              {doneCount} session{doneCount === 1 ? "" : "s"} logged
            </span>
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="inline-block h-2 w-2 bg-amber-mf" />
              Up next <span className="font-mono tabular-nums">· {startTime}</span>
            </span>
            {(pacePercent > 0 || daysToExam > 0) && (
              <span className="ml-auto font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                {pacePercent > 0 && `${pacePercent}% on pace`}
                {pacePercent > 0 && daysToExam > 0 && " · "}
                {daysToExam > 0 && `${daysToExam}d to exam`}
              </span>
            )}
          </div>
        </div>
      )}

      <CalendarStatus count={calendarsConnected} />

      {/* Default-session-length setting — collapsed by default; lives in the hero
          so it's reachable from the dashboard, but doesn't hijack the layout. */}
      <details className="group mt-4">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md border border-hair px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-paper dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/40 [&::-webkit-details-marker]:hidden">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
            <circle cx="6" cy="6" r="2" />
            <path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11M2.5 2.5l1 1M8.5 8.5l1 1M2.5 9.5l1-1M8.5 3.5l1-1" />
          </svg>
          Default session length:
          <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
            {calendarPreferredSessionMin} min
          </span>
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="ml-auto transition-transform group-open:rotate-180"
          >
            <path d="M2.5 4l2.5 2.5L7.5 4" />
          </svg>
        </summary>
        <div className="mt-2">
          <PreferredSessionControl
            value={calendarPreferredSessionMin}
            onChange={onCalendarPreferredSessionMinChange}
          />
        </div>
      </details>
    </div>
  );
}

function formatStampDate(d: Date): string {
  const wd = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const day = d.getDate();
  const mo = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const yr = d.getFullYear();
  return `${wd} · ${day} ${mo} ${yr}`;
}

function formatHM(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function TodaysDocket({
  windows,
  nextWindow,
  minutesToday,
}: {
  windows: DashWindow[];
  nextWindow: DashWindow | null;
  minutesToday: number;
}) {
  if (windows.length === 0) return null;

  const totalPlannedMin = windows.reduce((s, w) => s + w.durationMin, 0);
  const doneCount = windows.filter((w) => w.status === "done").length;
  const remainingMin = Math.max(0, totalPlannedMin - minutesToday);

  const nextLabel = nextWindow
    ? new Date(nextWindow.startTime).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  const titleSubject = `${capitalize(numberWord(windows.length))} ${
    windows.length === 1 ? "session" : "sessions"
  }.`;
  const titleObject =
    doneCount > 0 ? `${capitalize(numberWord(doneCount))} done.` : null;

  return (
    <div className="mt-[18px] rounded-2xl border border-hair bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-7">
      {/* Editorial header */}
      <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-amber-mf">
        <span aria-hidden className="inline-block h-px w-4 bg-amber-mf" />
        Today&apos;s docket
      </p>
      <h2 className="mt-2 font-display text-2xl font-medium leading-tight tracking-tight text-ink dark:text-slate-100 sm:text-[26px]">
        {titleSubject}
        {titleObject && (
          <>
            {" "}
            <span className="text-slate-400 dark:text-slate-500">·</span>{" "}
            {titleObject}
          </>
        )}
      </h2>
      <p className="mt-1 text-[12.5px] text-slate-600 dark:text-slate-400">
        <span className="font-semibold text-ink dark:text-slate-100">
          {formatHM(remainingMin)}
        </span>{" "}
        remaining
        {nextLabel && (
          <>
            {" "}
            <span className="text-slate-300 dark:text-slate-600">·</span> next
            at <span className="font-mono tabular-nums">{nextLabel}</span>
          </>
        )}
      </p>

      {/* Desktop ribbon */}
      <div className="hidden sm:block">
        <DayRibbon
          windows={windows}
          highlightId={nextWindow?.id ?? null}
        />
      </div>

      {/* Mobile vertical list */}
      <div className="sm:hidden">
        <TodayTimeline
          windows={windows}
          highlightId={nextWindow?.id ?? null}
        />
      </div>
    </div>
  );
}

function numberWord(n: number): string {
  const words = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
  ];
  return n >= 0 && n <= 12 ? words[n] : String(n);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

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
          className="min-w-[140px] flex-1 accent-emerald-600"
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
          className="min-w-[140px] flex-1 accent-emerald-600"
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
        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:opacity-60 [-webkit-tap-highlight-color:transparent] dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400"
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
                  ? "bg-emerald-700 text-white dark:bg-emerald-500 dark:text-emerald-950"
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
          className="font-medium text-emerald-700 transition-colors hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          + Add calendar
        </button>
      ) : (
        <span className="flex items-center gap-2">
          <a href="/api/calendar/oauth/google?returnTo=/app" className="font-medium text-emerald-700 transition-colors hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300">Google</a>
          <a href="/api/calendar/oauth/outlook?returnTo=/app" className="font-medium text-emerald-700 transition-colors hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300">Outlook</a>
        </span>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowTip(!showTip)}
          aria-label="Why connect multiple calendars?"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[10px] font-bold text-slate-400 transition-colors hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-600 dark:hover:border-emerald-400 dark:hover:text-emerald-400"
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

const UP_NEXT_VISIBLE = 3;

function WindowRow({
  window,
  showConnector,
  isHighlight = false
}: {
  window: DashWindow;
  showConnector: boolean;
  isHighlight?: boolean;
}) {
  const isDone = window.status === "done";
  return (
    <div className="relative flex items-start gap-3 py-2.5" role="listitem">
      {showConnector && (
        <div className="absolute left-[11px] top-9 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
      )}
      <TimelineDot status={window.status} isHighlight={isHighlight} />
      <div className="min-w-0 flex-1">
        <p
          className={
            (isHighlight ? "font-semibold " : "font-medium ") +
            "text-sm " +
            (isDone
              ? "text-slate-400 dark:text-slate-500"
              : "text-ink dark:text-slate-100")
          }
        >
          {window.topicName || "Study session"}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {new Date(window.startTime).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
          })}{" "}
          &middot; {window.durationMin} min
        </p>
      </div>
    </div>
  );
}

/**
 * Today's timeline, grouped to keep the dashboard scannable even when the day
 * has many windows:
 *   - "Earlier today (N)" — disclosure, collapsed by default. Holds all `done`.
 *   - Current (if any) + first {UP_NEXT_VISIBLE} upcoming, always visible.
 *   - "Show N more" — disclosure for the rest of upcoming.
 */
function TodayTimeline({
  windows,
  highlightId = null,
}: {
  windows: DashWindow[];
  highlightId?: string | null;
}) {
  const [showEarlier, setShowEarlier] = useState(false);
  const [showLater, setShowLater] = useState(false);

  const earlier = windows.filter((w) => w.status === "done");
  const live = windows.filter((w) => w.status !== "done");
  const visibleLive = live.slice(0, UP_NEXT_VISIBLE);
  const hiddenLive = live.slice(UP_NEXT_VISIBLE);

  if (windows.length === 0) return null;

  return (
    <div className="mt-4">
      {earlier.length > 0 ? (
        <div className="mb-2">
          <button
            type="button"
            onClick={() => setShowEarlier((v) => !v)}
            aria-expanded={showEarlier}
            className="flex items-center gap-2 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <span aria-hidden className={"transition-transform " + (showEarlier ? "rotate-90" : "")}>
              ›
            </span>
            Earlier today ({earlier.length})
          </button>
          {showEarlier ? (
            <div className="flex flex-col" role="list">
              {earlier.map((w, i) => (
                <WindowRow
                  key={w.id}
                  window={w}
                  showConnector={i < earlier.length - 1 || live.length > 0}
                  isHighlight={w.id === highlightId}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col" role="list">
        {visibleLive.map((w, i) => (
          <WindowRow
            key={w.id}
            window={w}
            showConnector={
              i < visibleLive.length - 1 || (showLater && hiddenLive.length > 0)
            }
            isHighlight={w.id === highlightId}
          />
        ))}
        {showLater
          ? hiddenLive.map((w, i) => (
              <WindowRow
                key={w.id}
                window={w}
                showConnector={i < hiddenLive.length - 1}
                isHighlight={w.id === highlightId}
              />
            ))
          : null}
      </div>

      {hiddenLive.length > 0 ? (
        <button
          type="button"
          onClick={() => setShowLater((v) => !v)}
          aria-expanded={showLater}
          className="mt-2 flex items-center gap-2 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <span aria-hidden className={"transition-transform " + (showLater ? "rotate-90" : "")}>
            ›
          </span>
          {showLater ? "Show fewer" : `Show ${hiddenLive.length} more window${hiddenLive.length === 1 ? "" : "s"}`}
        </button>
      ) : null}
    </div>
  );
}

function TimelineDot({
  status,
  isHighlight = false,
}: {
  status: WindowStatus;
  isHighlight?: boolean;
}) {
  if (status === "done") {
    return (
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-500">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 7l3 3 5-5" /></svg>
      </div>
    );
  }
  if (status === "current" || isHighlight) {
    return (
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-mf-soft text-amber-mf ring-[3px] ring-amber-mf/15 dark:bg-amber-mf/15">
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

