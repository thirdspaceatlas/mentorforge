"use client";

import type { FeasibilityGrade, PlannedSession } from "@/lib/plan/rebalance/types";

/**
 * "Review & confirm plan change" (FORGE-3 propose-and-confirm). The engine never
 * silently rewrites the plan — it proposes the redistributed sessions and the
 * candidate confirms. Shows the grade, any pacing nudge, and banked surplus.
 */

const GRADE_META: Record<FeasibilityGrade, { label: string; cls: string }> = {
  "on-track": { label: "On track", cls: "bg-accent-subtle text-accent" },
  tight: { label: "Tight", cls: "bg-amber-mf/15 text-amber-mf" },
  "at-risk": { label: "At risk", cls: "bg-amber-mf/20 text-amber-mf" },
};

function hoursLabel(minutes: number): string {
  const h = minutes / 60;
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export type ReviewConfirmPlanProps = {
  proposed: PlannedSession[];
  grade: FeasibilityGrade;
  surplusMinutes: number;
  pacingNudge: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ReviewConfirmPlan({
  proposed,
  grade,
  surplusMinutes,
  pacingNudge,
  onConfirm,
  onCancel,
}: ReviewConfirmPlanProps) {
  const totalMin = proposed.reduce((a, s) => a + s.plannedMinutes, 0);
  const g = GRADE_META[grade];

  return (
    <section
      className="overflow-hidden rounded-lg border border-hair bg-paper"
      aria-label="Review and confirm plan change"
      data-testid="review-confirm-plan"
    >
      <div className="flex items-center justify-between border-b border-hair px-5 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">
          Review &amp; confirm plan change
        </p>
        <span
          className={`inline-flex items-center rounded-sm px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${g.cls}`}
        >
          {g.label}
        </span>
      </div>

      <div className="px-5 py-5">
        {proposed.length === 0 ? (
          <p className="font-display text-lg text-ink">
            You’re on track — nothing to redistribute.
            {surplusMinutes > 0 && (
              <span className="text-ink/60">
                {" "}You’re {hoursLabel(surplusMinutes)} ahead; that buffer is banked.
              </span>
            )}
          </p>
        ) : (
          <>
            <p className="font-display text-lg leading-snug text-ink">
              We’d move {hoursLabel(totalMin)} of missed study forward into{" "}
              {proposed.length} session{proposed.length === 1 ? "" : "s"} — earliest
              first, within your safe pace.
            </p>
            {pacingNudge && (
              <p className="mt-2 max-w-prose text-sm text-amber-mf">{pacingNudge}</p>
            )}

            <ul className="mt-4 divide-y divide-hair rounded-md border border-hair">
              {proposed.slice(0, 8).map((s) => (
                <li
                  key={s.id + s.date}
                  className="flex items-center justify-between px-4 py-2 text-sm"
                >
                  <span className="text-ink/80">{formatDate(s.date)}</span>
                  <span className="font-mono text-ink/60">+{s.plannedMinutes} min</span>
                </li>
              ))}
              {proposed.length > 8 && (
                <li className="px-4 py-2 text-xs text-ink/45">
                  +{proposed.length - 8} more session
                  {proposed.length - 8 === 1 ? "" : "s"}…
                </li>
              )}
            </ul>
          </>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            data-testid="confirm-plan-change"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover"
          >
            Confirm plan change
          </button>
          <button
            type="button"
            onClick={onCancel}
            data-testid="cancel-plan-change"
            className="rounded-md border border-hair px-4 py-2 text-sm text-ink/70 transition hover:border-ink/30"
          >
            Keep current plan
          </button>
        </div>
      </div>
    </section>
  );
}
