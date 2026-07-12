"use client";

import { useMemo, useState } from "react";
import { rebalance } from "@/lib/plan/rebalance/engine";
import {
  extendExamWindow,
  raiseCapacity,
  reduceScope,
  type ScopeTopic,
} from "@/lib/plan/rebalance/resolutions";
import { DEFAULT_GUARDRAILS } from "@/lib/plan/rebalance/guardrails";
import { CFA_L1_TOPICS } from "@/lib/plan/syllabusCfaL1";
import type {
  AvailabilityProfile,
  DayOfWeek,
  PlannedSession,
  RebalanceInput,
} from "@/lib/plan/rebalance/types";
import {
  InfeasibilityCard,
  type ResolutionKind,
  type ResolutionState,
} from "@/components/calendar/InfeasibilityCard";
import { ReviewConfirmPlan } from "@/components/calendar/ReviewConfirmPlan";

const SCOPE_TOPICS: ScopeTopic[] = CFA_L1_TOPICS.map((t) => ({
  id: t.id,
  name: t.name,
  weightHours: t.recommendedHours,
}));

// Lowest exam-weight topics first — what "cut scope" would drop.
const LOWEST_WEIGHT_DROP = ["deriv", "alts", "pm", "fixed", "corpfin", "quant"];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
function addDaysISO(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

function buildProfile(dailyTargetMin: number): AvailabilityProfile {
  const days = Array.from({ length: 7 }, (_, dow) => ({
    dayOfWeek: dow as DayOfWeek,
    available: true,
    windows: [{ start: 1080, end: 1320, targetSessionMinutes: dailyTargetMin }],
  }));
  return { userId: "preview", days, guardrails: DEFAULT_GUARDRAILS };
}

function hoursLabel(minutes: number): string {
  const h = minutes / 60;
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
}

export function InfeasibilityPreviewClient() {
  const [hoursBehind, setHoursBehind] = useState(24);
  const [examWeeks, setExamWeeks] = useState(6);
  const [dailyTargetHours, setDailyTargetHours] = useState(0.5);
  const [states, setStates] = useState<Partial<Record<ResolutionKind, ResolutionState>>>({});
  const [confirmed, setConfirmed] = useState(false);

  const asOf = useMemo(() => new Date(todayISO() + "T00:00:00Z"), []);

  const input: RebalanceInput = useMemo(() => {
    const deficitMin = Math.round(hoursBehind * 60);
    const sessions: PlannedSession[] = [
      {
        id: "behind",
        date: todayISO(),
        dayOfWeek: 0,
        windowId: null,
        topicIds: [],
        plannedMinutes: deficitMin,
        actualMinutes: 0,
        status: "missed",
        source: "plan",
      },
    ];
    return {
      examDate: addDaysISO(todayISO(), examWeeks * 7),
      targetMinutes: 18000,
      profile: buildProfile(Math.round(dailyTargetHours * 60)),
      sessions,
      asOf,
    };
  }, [hoursBehind, examWeeks, dailyTargetHours, asOf]);

  const result = useMemo(() => rebalance(input), [input]);

  function runResolution(kind: ResolutionKind) {
    setStates((s) => ({ ...s, [kind]: { loading: true } }));
    // Recompute synchronously (pure engine); tiny delay to show the state.
    setTimeout(() => {
      let nowFeasible = false;
      let detail = "";
      if (kind === "extend-exam-window") {
        const nextSitting = addDaysISO(input.examDate, 16 * 7); // ~next sitting
        const o = extendExamWindow(input, nextSitting);
        nowFeasible = Boolean(o.impact.nowFeasible);
        detail = `New exam ${nextSitting} (+${o.impact.addedDays as number}d runway).`;
      } else if (kind === "raise-capacity") {
        const o = raiseCapacity(input);
        nowFeasible = Boolean(o.impact.nowFeasible);
        detail = `Daily target → ${hoursLabel(o.impact.newDailyTargetMinutes as number)} (cap ${hoursLabel(
          o.impact.hardCapMinutes as number,
        )}).`;
      } else {
        const o = reduceScope(input, SCOPE_TOPICS, LOWEST_WEIGHT_DROP);
        nowFeasible = Boolean(o.impact.nowFeasible);
        detail = `Coverage ${o.impact.coverageRemainingPct as number}% · load ${hoursLabel(
          o.impact.reducedLoadMinutes as number,
        )} (was ${hoursLabel(o.impact.originalLoadMinutes as number)}).`;
      }
      setStates((s) => ({ ...s, [kind]: { loading: false, nowFeasible, detail } }));
    }, 250);
  }

  return (
    <section className="min-h-screen bg-paper px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/40">
          DEV PREVIEW · FORGE-3 rebalancing
        </p>
        <h1 className="font-display text-2xl text-ink">Calendar Coach — honest pacing</h1>
        <p className="mt-1 max-w-prose text-sm text-ink/60">
          Drag the inputs to fall behind. When the plan can no longer absorb the
          deficit within a healthy pace, the engine stops overfilling and raises
          the infeasibility event.
        </p>

        <div className="my-6 grid gap-4 rounded-lg border border-hair bg-paper p-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm text-ink/70">
            <span>
              Hours behind: <b className="text-ink">{hoursBehind}h</b>
            </span>
            <input
              type="range" min={1} max={80} value={hoursBehind}
              onChange={(e) => { setStates({}); setConfirmed(false); setHoursBehind(Number(e.target.value)); }}
              data-testid="input-hours-behind"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink/70">
            <span>
              Weeks to exam: <b className="text-ink">{examWeeks}</b>
            </span>
            <input
              type="range" min={3} max={40} value={examWeeks}
              onChange={(e) => { setStates({}); setConfirmed(false); setExamWeeks(Number(e.target.value)); }}
              data-testid="input-exam-weeks"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink/70">
            <span>
              Daily target: <b className="text-ink">{dailyTargetHours}h</b>
            </span>
            <input
              type="range" min={0.5} max={4} step={0.5} value={dailyTargetHours}
              onChange={(e) => { setStates({}); setConfirmed(false); setDailyTargetHours(Number(e.target.value)); }}
              data-testid="input-daily-target"
            />
          </label>
        </div>

        {confirmed ? (
          <div
            className="rounded-lg border border-accent/40 bg-accent-subtle px-5 py-4 text-accent"
            data-testid="plan-confirmed"
          >
            Plan change confirmed. (In the app this writes the redistributed
            sessions and records the event.)
          </div>
        ) : result.kind === "infeasible" ? (
          <InfeasibilityCard
            message={result.message}
            unplaceableMinutes={result.unplaceableMinutes}
            options={result.options}
            onResolve={runResolution}
            states={states}
          />
        ) : (
          <ReviewConfirmPlan
            proposed={result.sessions}
            grade={result.grade}
            surplusMinutes={result.surplusMinutes}
            pacingNudge={result.pacingNudge}
            onConfirm={() => setConfirmed(true)}
            onCancel={() => setConfirmed(false)}
          />
        )}
      </div>
    </section>
  );
}
