"use client";

import type { InfeasibleOption } from "@/lib/plan/rebalance/types";

/**
 * The first-class infeasibility card (FORGE-3 spec §7) — the headline moment.
 * Tells the candidate the truth ("you're X behind and it can't be absorbed")
 * and offers honest tradeoffs. "Move my exam date" is always present.
 */

export type ResolutionKind = "extend-exam-window" | "raise-capacity" | "reduce-scope";

export type ResolutionState = {
  loading?: boolean;
  nowFeasible?: boolean;
  detail?: string;
};

type OptionMeta = {
  key: ResolutionKind;
  label: string;
  blurb: string;
};

const OPTION_META: Record<ResolutionKind, OptionMeta> = {
  "extend-exam-window": {
    key: "extend-exam-window",
    label: "Move my exam date",
    blurb: "Push to the next sitting and recompute against the new runway.",
  },
  "reduce-scope": {
    key: "reduce-scope",
    label: "Cut scope",
    blurb: "Deprioritize the lowest exam-weight topics — we’ll show the coverage cost.",
  },
  "raise-capacity": {
    key: "raise-capacity",
    label: "Study more per week",
    blurb: "Raise your daily target toward your safe ceiling — we’ll show the cost.",
  },
};

function hoursLabel(minutes: number): string {
  const h = minutes / 60;
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
}

export type InfeasibilityCardProps = {
  message: string;
  unplaceableMinutes: number;
  options: InfeasibleOption[];
  onResolve: (kind: ResolutionKind) => void;
  states?: Partial<Record<ResolutionKind, ResolutionState>>;
};

export function InfeasibilityCard({
  message,
  unplaceableMinutes,
  options,
  onResolve,
  states = {},
}: InfeasibilityCardProps) {
  // Keep the three actionable resolutions, in the spec's order; drop "accept-gap"
  // from the primary CTAs (it's the do-nothing fallback surfaced as plain text).
  const actionable = options.filter(
    (o): o is ResolutionKind => o in OPTION_META,
  );

  return (
    <section
      className="overflow-hidden rounded-lg border border-amber-mf/40 bg-amber-mf-soft/60"
      aria-label="Plan at risk"
      data-testid="infeasibility-card"
    >
      <div className="border-b border-amber-mf/30 bg-amber-mf/10 px-5 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-mf">
          Plan at risk · honest check
        </p>
      </div>

      <div className="px-5 py-5">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-3xl leading-none text-ink">
            {hoursLabel(unplaceableMinutes)}
          </span>
          <span className="text-sm text-ink/60">can’t be placed before your exam</span>
        </div>

        <p className="mt-3 max-w-prose font-display text-lg leading-snug text-ink">
          {message}
        </p>
        <p className="mt-2 max-w-prose text-sm text-ink/60">
          We won’t cram it into the weeks you have left — that’s how plans quietly
          break. Here’s what actually moves the needle. Pick one:
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {actionable.map((key) => {
            const meta = OPTION_META[key];
            const st = states[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => onResolve(key)}
                disabled={st?.loading}
                data-testid={`resolve-${key}`}
                className="group flex flex-col rounded-md border border-hair bg-paper px-4 py-3 text-left transition hover:border-accent hover:shadow-sm disabled:opacity-60"
              >
                <span className="font-medium text-ink group-hover:text-accent">
                  {meta.label}
                </span>
                <span className="mt-1 text-xs leading-snug text-ink/55">{meta.blurb}</span>

                {st?.loading && (
                  <span className="mt-2 font-mono text-[10px] uppercase tracking-wider text-ink/40">
                    Recomputing…
                  </span>
                )}
                {!st?.loading && st?.nowFeasible !== undefined && (
                  <span
                    className={`mt-2 inline-flex w-fit items-center rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                      st.nowFeasible
                        ? "bg-accent-subtle text-accent"
                        : "bg-amber-mf/15 text-amber-mf"
                    }`}
                  >
                    {st.nowFeasible ? "Now feasible" : "Still tight"}
                  </span>
                )}
                {st?.detail && (
                  <span className="mt-1 text-xs text-ink/60">{st.detail}</span>
                )}
              </button>
            );
          })}
        </div>

        {options.includes("accept-gap") && (
          <p className="mt-4 text-xs text-ink/45">
            Or accept the gap for now — we’ll keep {hoursLabel(unplaceableMinutes)}{" "}
            visible so the decision stays yours, not hidden.
          </p>
        )}
      </div>
    </section>
  );
}
