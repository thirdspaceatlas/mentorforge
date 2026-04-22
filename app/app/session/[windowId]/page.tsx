"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Events, track, bucketSessionMinutes } from "@/lib/analytics";

/**
 * Session page — three states: ready → active → complete.
 * Renders as a full-viewport overlay (no nav, no footer, no chrome).
 * Route: /app/session/[windowId]
 *
 * Fetches window data from GET /api/calendar/windows.
 * Creates/completes sessions via POST/PATCH /api/calendar/sessions.
 */

type SessionState = "ready" | "active" | "complete";
type StudyType = "review" | "new" | "practice";

type WindowData = {
  id: string;
  topicName: string | null;
  studyType: string | null;
  durationMin: number;
  startTime: string;
  status: "done" | "current" | "upcoming";
  session: {
    id: string;
    startedAt: string;
    completedAt: string | null;
    interrupted: boolean;
    actualMin: number | null;
    plannedDurationMin?: number | null;
  } | null;
};

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const windowId = params.windowId as string;

  const [state, setState] = useState<SessionState>("ready");
  const [windowData, setWindowData] = useState<WindowData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [plannedMin, setPlannedMin] = useState<number | null>(null);
  const [prefFromPlan, setPrefFromPlan] = useState(45);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const totalSeconds = useMemo(() => {
    const cap = windowData?.durationMin ?? 12;
    const pm = plannedMin ?? cap;
    return Math.min(cap, Math.max(5, pm)) * 60;
  }, [plannedMin, windowData?.durationMin]);

  const topic = windowData?.topicName || "Study session";
  const studyType = (windowData?.studyType as StudyType) || "review";

  const elapsed = totalSeconds - remaining;
  const elapsedMin = Math.floor(elapsed / 60);
  const isQuickWin = elapsedMin < 10 && state === "complete";

  const min = Math.floor(remaining / 60);
  const sec = remaining % 60;
  const display = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;

  // Fetch window + study plan preference
  useEffect(() => {
    const date = new Date().toISOString().slice(0, 10);
    Promise.all([
      fetch(`/api/calendar/windows?date=${date}`).then((r) => r.json()),
      fetch(`/api/study-plan`).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([data, planData]) => {
        const win = data.windows?.find((w: WindowData) => w.id === windowId);
        const pref =
          typeof planData?.plan?.calendarPreferredSessionMin === "number"
            ? Math.min(
                180,
                Math.max(5, Math.round(planData.plan.calendarPreferredSessionMin))
              )
            : 45;
        setPrefFromPlan(pref);

        if (!win) return;

        setWindowData(win);
        const windowMax = win.durationMin;

        if (win.session?.completedAt) {
          setSessionId(win.session.id);
          setPlannedMin(win.session.plannedDurationMin ?? win.durationMin);
          setState("complete");
          return;
        }

        if (win.session && !win.session.completedAt) {
          const pm = win.session.plannedDurationMin ?? win.durationMin;
          setPlannedMin(pm);
          setSessionId(win.session.id);
          const started = new Date(win.session.startedAt).getTime();
          startTimeRef.current = started;
          setRemaining(
            Math.max(0, pm * 60 - Math.floor((Date.now() - started) / 1000))
          );
          setState("active");
          return;
        }

        const initial = Math.min(pref, windowMax);
        setPlannedMin(initial);
        setRemaining(initial * 60);
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [windowId]);

  // Update tab title
  useEffect(() => {
    if (state === "ready") document.title = `${topic} · MentorForge`;
    else if (state === "active") document.title = `${topic} · ${display}`;
    else document.title = "Session logged · MentorForge";
  }, [state, display, topic]);

  // Timer tick
  const tick = useCallback(() => {
    if (!startTimeRef.current) return;
    const elapsedSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const next = Math.max(0, totalSeconds - elapsedSec);
    setRemaining(next);
    if (next <= 0 && intervalRef.current) clearInterval(intervalRef.current);
  }, [totalSeconds]);

  // Start/stop the timer interval whenever state changes to/from active
  useEffect(() => {
    if (state !== "active") return;
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [state, tick]);

  // Recalculate on visibility change
  useEffect(() => {
    if (state !== "active") return;
    const h = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", h);
    return () => document.removeEventListener("visibilitychange", h);
  }, [state, tick]);

  const startSession = useCallback(async () => {
    if (plannedMin == null || !windowData) return;
    setActionError(null);
    try {
      const res = await fetch("/api/calendar/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          windowId,
          plannedDurationMin: Math.min(windowData.durationMin, Math.max(5, plannedMin)),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSessionId(data.session.id);
      } else {
        setActionError("Couldn't start session. Try again.");
        return;
      }
    } catch {
      setActionError("Network error. Check your connection.");
      return;
    }

    startTimeRef.current = Date.now();
    setRemaining(totalSeconds);
    setState("active");
  }, [plannedMin, windowData, windowId, totalSeconds]);

  const completeSession = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState("complete");

    if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);

    const elapsedMin = Math.max(
      0,
      Math.round((Date.now() - (startTimeRef.current ?? Date.now())) / 60000),
    );
    track(Events.sessionCompleted, {
      duration_minutes_bucket: bucketSessionMinutes(elapsedMin),
      was_interrupted: "false",
      trigger: "scheduled_window",
    });

    if (sessionId) {
      try {
        await fetch("/api/calendar/sessions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, action: "complete" }),
        });
      } catch {
        // Session is marked complete locally. Server sync will catch up.
      }
    }
  }, [sessionId]);

  const interruptSession = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRemaining(totalSeconds);
    setState("ready");

    if (sessionId) {
      try {
        await fetch("/api/calendar/sessions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, action: "interrupt" }),
        });
      } catch {
        // Best effort — interruption is already reflected in UI
      }
      setSessionId(null);
    }
  }, [sessionId, totalSeconds]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (state === "ready") startSession();
        else if (state === "active") completeSession();
      }
      if (e.key === "Escape") {
        if (state === "active") interruptSession();
        else if (state === "ready") router.push("/app");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [state, startSession, completeSession, interruptSession, router]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#fafaf9] dark:bg-slate-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#fafaf9] dark:bg-slate-950">
        <div className="text-center">
          <p className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
            Something went wrong
          </p>
          <p className="mt-1 text-sm text-slate-500">Couldn&apos;t load this study window.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-sky-950 hover:bg-sky-400"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!windowData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#fafaf9] dark:bg-slate-950">
        <div className="text-center">
          <p className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
            Window not found
          </p>
          <p className="mt-1 text-sm text-slate-500">This study window may have passed.</p>
          <button
            onClick={() => router.push("/app")}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-sky-500 hover:text-sky-400"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const maxSelectable = windowData.durationMin;
  const sliderValue = plannedMin ?? Math.min(prefFromPlan, maxSelectable);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#fafaf9] dark:bg-slate-950">
      <div className="w-full max-w-md px-4 text-center sm:rounded-lg sm:border sm:border-slate-200 sm:bg-white sm:px-8 sm:py-10 sm:shadow-sm sm:dark:border-slate-700 sm:dark:bg-slate-900">

        {state === "ready" && (
          <div>
            {actionError && (
              <p className="mb-4 rounded-md border border-rose-200/90 bg-rose-50/90 px-4 py-2.5 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
                {actionError}
              </p>
            )}
            <h1 className="font-display text-2xl font-semibold leading-tight text-slate-900 dark:text-slate-100">
              {topic}
            </h1>
            <div className="mt-1 flex items-center justify-center gap-2.5">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Up to {maxSelectable} min available
              </span>
              <TypeBadge type={studyType} />
            </div>
            <div className="mt-6 text-left">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Session length (timer)
              </label>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <input
                  type="range"
                  min={5}
                  max={maxSelectable}
                  step={1}
                  value={sliderValue}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setPlannedMin(n);
                    setRemaining(n * 60);
                  }}
                  className="min-w-[160px] flex-1 accent-sky-500"
                  aria-valuemin={5}
                  aria-valuemax={maxSelectable}
                  aria-valuenow={sliderValue}
                />
                <span className="text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                  {sliderValue} min
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                Default {Math.min(prefFromPlan, maxSelectable)} min from your Calendar Coach setting — adjust for a short burst or a deep block.
              </p>
            </div>
            <div className="mt-8 space-y-2">
              <button
                onClick={startSession}
                className="flex min-h-[48px] w-full items-center justify-center rounded-md bg-sky-500 px-6 py-3 text-base font-semibold text-sky-950 transition-colors hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 [-webkit-tap-highlight-color:transparent]"
              >
                Start Now
              </button>
              <button
                onClick={() => router.push("/app")}
                className="flex min-h-[44px] w-full items-center justify-center rounded-md bg-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 [-webkit-tap-highlight-color:transparent]"
              >
                Back to dashboard
              </button>
            </div>
          </div>
        )}

        {state === "active" && (
          <div>
            <h2 className="font-display text-2xl font-semibold leading-tight text-slate-900 dark:text-slate-100">
              {topic}
            </h2>
            <div className="mt-1"><TypeBadge type={studyType} /></div>
            <div
              className="mt-6 font-display text-6xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-slate-100 sm:text-7xl"
              aria-live="polite"
            >
              {display}
            </div>
            <div className="mt-8 space-y-2">
              <button
                onClick={completeSession}
                className="flex min-h-[48px] w-full items-center justify-center rounded-md bg-sky-500 px-6 py-3 text-base font-semibold text-sky-950 transition-colors hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 [-webkit-tap-highlight-color:transparent]"
              >
                Done
              </button>
              <button
                onClick={interruptSession}
                className="flex min-h-[44px] w-full items-center justify-center rounded-md bg-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 [-webkit-tap-highlight-color:transparent]"
              >
                I got interrupted
              </button>
            </div>
          </div>
        )}

        {state === "complete" && (
          <div>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 motion-safe:animate-[checkIn_0.4s_ease_forwards] dark:bg-emerald-500/15 dark:text-emerald-500">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 14l5 5 9-9" />
              </svg>
            </div>
            <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Session logged.
            </h2>
            <p className="mt-1 text-sm text-slate-500 motion-safe:animate-[slideIn_0.4s_ease_1s_forwards] motion-safe:opacity-0 dark:text-slate-400">
              Back to your dashboard for what&apos;s next.
            </p>
            {isQuickWin && (
              <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 motion-safe:animate-[slideIn_0.4s_ease_0.6s_forwards] motion-safe:opacity-0 dark:bg-emerald-500/15 dark:text-emerald-400">
                &#9889; Quick Win
              </span>
            )}
            <div className="mt-8">
              <button
                onClick={() => router.push("/app")}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 3L5 7l4 4" /></svg>
                Back to dashboard
              </button>
            </div>
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
