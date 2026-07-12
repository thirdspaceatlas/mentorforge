"use client";

import { useMemo } from "react";
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
  InfeasibleOption,
  PlannedSession,
  RebalanceInput,
} from "@/lib/plan/rebalance/types";
import {
  InfeasibilityBanner,
  type BannerEvent,
} from "@/components/calendar/InfeasibilityBanner";
import type { ResolutionKind } from "@/components/calendar/InfeasibilityCard";

const SCOPE_TOPICS: ScopeTopic[] = CFA_L1_TOPICS.map((t) => ({
  id: t.id,
  name: t.name,
  weightHours: t.recommendedHours,
}));
const LOWEST_WEIGHT_DROP = ["deriv", "alts", "pm", "fixed", "corpfin", "quant"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function addDaysISO(iso: string, n: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}
function hoursLabel(min: number) {
  const h = min / 60;
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
}

export function DashboardInfeasibilityClient() {
  // A candidate who's fallen badly behind with a tight runway → infeasible.
  const input: RebalanceInput = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, dow) => ({
      dayOfWeek: dow as DayOfWeek,
      available: true,
      windows: [{ start: 1080, end: 1320, targetSessionMinutes: 30 }],
    }));
    const profile: AvailabilityProfile = {
      userId: "preview",
      days,
      guardrails: DEFAULT_GUARDRAILS,
    };
    const sessions: PlannedSession[] = [
      {
        id: "behind",
        date: todayISO(),
        dayOfWeek: 0,
        windowId: null,
        topicIds: [],
        plannedMinutes: 30 * 60, // 30h behind
        actualMinutes: 0,
        status: "missed",
        source: "plan",
      },
    ];
    return {
      examDate: addDaysISO(todayISO(), 6 * 7),
      targetMinutes: 18000,
      profile,
      sessions,
      asOf: new Date(todayISO() + "T00:00:00Z"),
    };
  }, []);

  const result = useMemo(() => rebalance(input), [input]);
  const event: BannerEvent =
    result.kind === "infeasible"
      ? {
          id: "preview",
          unplaceableMinutes: result.unplaceableMinutes,
          message: result.message,
          options: result.options,
        }
      : {
          id: "preview",
          unplaceableMinutes: 0,
          message: "On track.",
          options: [] as InfeasibleOption[],
        };

  function onResolvePreview(kind: ResolutionKind) {
    if (kind === "extend-exam-window") {
      const next = addDaysISO(input.examDate, 16 * 7);
      const o = extendExamWindow(input, next);
      return {
        nowFeasible: Boolean(o.impact.nowFeasible),
        detail: `New exam ${next} (+${o.impact.addedDays as number}d).`,
      };
    }
    if (kind === "raise-capacity") {
      const o = raiseCapacity(input);
      return {
        nowFeasible: Boolean(o.impact.nowFeasible),
        detail: `Daily target → ${hoursLabel(o.impact.newDailyTargetMinutes as number)}.`,
      };
    }
    const o = reduceScope(input, SCOPE_TOPICS, LOWEST_WEIGHT_DROP);
    return {
      nowFeasible: Boolean(o.impact.nowFeasible),
      detail: `Coverage ${o.impact.coverageRemainingPct as number}% · load ${hoursLabel(
        o.impact.reducedLoadMinutes as number,
      )}.`,
    };
  }

  return (
    <section className="min-h-screen bg-paper px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/40">
          DEV PREVIEW · dashboard integration
        </p>
        <h1 className="mb-6 font-display text-2xl text-ink">Today</h1>

        {/* Same container/chrome the real CalendarCoachDashboard injects into */}
        <div className="relative overflow-hidden rounded-2xl border border-hair bg-white p-5 shadow-sm sm:p-9">
          <InfeasibilityBanner seed={{ event, onResolvePreview }} />

          <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-amber-mf">
            <span aria-hidden className="inline-block h-px w-4 bg-amber-mf" />
            Next study session
          </p>
          <h2 className="mt-2.5 font-display text-3xl font-medium leading-[1.05] tracking-tight text-ink sm:text-4xl">
            Equity Investments<span className="text-slate-400">.</span>
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2.5 text-sm text-slate-600">
            <span className="font-mono">45 min</span>
            <span className="text-slate-300">·</span>
            <span className="font-mono">4:45 PM</span>
            <span className="text-slate-300">·</span>
            <span>Reading 23 · DCF practice</span>
          </div>
        </div>
      </div>
    </section>
  );
}
