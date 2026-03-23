import clsx from "clsx";

export type HeroPreviewVariant = "overview" | "focus";

const cardShell =
  "rounded-2xl border border-slate-200/95 bg-white p-6 shadow-[0_12px_40px_-12px_rgb(15_23_42/0.12),0_4px_16px_-4px_rgb(15_23_42/0.08)] ring-1 ring-slate-900/[0.04] " +
  "dark:border-slate-600/80 dark:bg-slate-900/90 dark:shadow-[0_20px_50px_-15px_rgb(0_0_0/0.45)] dark:ring-white/[0.06] " +
  "sm:p-7 sm:transform-gpu";

function OverviewCard() {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/90 pb-4 dark:border-slate-700/80">
        <div>
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Planner snapshot
          </p>
          <p className="mt-1.5 font-display text-lg font-medium tracking-tight text-slate-900 dark:text-slate-50">
            CFA Level II
          </p>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
            Exam window · Feb 2026
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full border border-emerald-200/90 bg-emerald-50/90 px-2.5 py-1 text-[0.7rem] font-medium text-emerald-800 dark:border-accent/40 dark:bg-accent/15 dark:text-emerald-100">
          On track
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-b border-slate-200/90 pb-4 dark:border-slate-700/80 sm:gap-4">
        <div>
          <p className="text-[0.65rem] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Readiness
          </p>
          <p className="mt-1 font-display text-xl font-medium tabular-nums text-slate-900 dark:text-slate-50">
            0.68
          </p>
        </div>
        <div>
          <p className="text-[0.65rem] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Weekly pace
          </p>
          <p className="mt-1 font-display text-xl font-medium tabular-nums text-slate-900 dark:text-slate-50">
            12.5h
          </p>
        </div>
        <div>
          <p className="text-[0.65rem] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Study weeks
          </p>
          <p className="mt-1 font-display text-xl font-medium tabular-nums text-slate-900 dark:text-slate-50">
            18 left
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        <p className="text-[0.65rem] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Upcoming weeks
        </p>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/85 bg-[#fafaf9] px-3 py-2.5 dark:border-slate-700/75 dark:bg-slate-950/55">
          <div>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-100">
              Week 9–15
            </p>
            <p className="text-[0.7rem] text-slate-600 dark:text-slate-400">
              18h planned · Quant &amp; Econ
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-amber-200/90 bg-amber-50/90 px-2 py-0.5 text-[0.65rem] font-medium text-amber-900 dark:border-amber-800/45 dark:bg-amber-950/55 dark:text-amber-100">
            Partial
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/85 bg-[#fafaf9] px-3 py-2.5 dark:border-slate-700/75 dark:bg-slate-950/55">
          <div>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-100">
              Week 16–22
            </p>
            <p className="text-[0.7rem] text-slate-600 dark:text-slate-400">
              20h planned · FRA focus
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-slate-300/90 bg-white px-2 py-0.5 text-[0.65rem] font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
            Not started
          </span>
        </div>
      </div>

      <p className="mt-4 border-t border-slate-200/90 pt-3.5 text-center text-[0.7rem] leading-relaxed text-slate-600 dark:border-slate-700/80 dark:text-slate-400">
        Missed hours roll forward — rebalance keeps future weeks honest.
      </p>
    </>
  );
}

function FocusCard() {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/90 pb-4 dark:border-slate-700/80">
        <div>
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Week focus
          </p>
          <p className="mt-1.5 font-display text-lg font-medium tracking-tight text-slate-900 dark:text-slate-50">
            Week 9–15
          </p>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
            Quant · Econ · Portfolio Mgmt
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full border border-amber-200/90 bg-amber-50/90 px-2.5 py-1 text-[0.7rem] font-medium text-amber-900 dark:border-amber-800/45 dark:bg-amber-950/55 dark:text-amber-100">
          Catching up
        </span>
      </div>

      <div className="mt-4 space-y-4 border-b border-slate-200/90 pb-4 dark:border-slate-700/80">
        <div>
          <div className="flex items-baseline justify-between gap-2 text-[0.65rem] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <span>Hours this week</span>
            <span className="font-display text-sm tabular-nums text-slate-800 dark:text-slate-100">
              11.5 / 18h
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200/90 dark:bg-slate-800/90">
            <div className="h-full min-w-[12%] w-[64%] rounded-full bg-accent" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/85 bg-[#fafaf9] px-3 py-2.5 dark:border-slate-700/75 dark:bg-slate-950/55">
          <p className="text-[0.65rem] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Rebalance
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
            +2.5h rolled forward to Week 16–22 so your runway stays realistic.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-xl border border-slate-200/85 bg-white/80 px-3 py-2.5 dark:border-slate-700/75 dark:bg-slate-950/40">
          <p className="text-[0.65rem] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Logged (7d)
          </p>
          <p className="mt-1 font-display text-lg font-medium tabular-nums text-slate-900 dark:text-slate-50">
            11.5h
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/85 bg-white/80 px-3 py-2.5 dark:border-slate-700/75 dark:bg-slate-950/40">
          <p className="text-[0.65rem] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Plan status
          </p>
          <p className="mt-1 font-display text-lg font-medium tabular-nums text-slate-900 dark:text-slate-50">
            Active
          </p>
        </div>
      </div>

      <p className="mt-4 border-t border-slate-200/90 pt-3.5 text-center text-[0.7rem] leading-relaxed text-slate-600 dark:border-slate-700/80 dark:text-slate-400">
        Follow your first incomplete week — or jump to a calendar window near your exam.
      </p>
    </>
  );
}

type HeroProductPreviewProps = {
  variant?: HeroPreviewVariant;
  /** Slight tilt for visual depth in the two-up grid */
  tilt?: "left" | "right" | "none";
  className?: string;
};

/**
 * Static marketing preview — not connected to planner state.
 * Suggests the real product UI without embedding app logic.
 */
export function HeroProductPreview({
  variant = "overview",
  tilt = "right",
  className
}: HeroProductPreviewProps) {
  const tiltClass =
    tilt === "left"
      ? "sm:-rotate-[1deg]"
      : tilt === "right"
        ? "sm:rotate-[1deg]"
        : "";

  return (
    <div className={clsx("w-full", className)}>
      <div className={clsx(cardShell, tiltClass)}>
        {variant === "overview" ? <OverviewCard /> : <FocusCard />}
      </div>
    </div>
  );
}

/** Two product snapshots for the marketing hero — balanced pair on md+ */
export function HeroProductPreviews() {
  return (
    <div className="mx-auto mt-14 w-full max-w-5xl px-4 sm:mt-16 sm:px-6">
      <div className="grid gap-8 sm:gap-10 md:grid-cols-2 md:items-start md:gap-8 lg:gap-10">
        <HeroProductPreview variant="overview" tilt="left" />
        <HeroProductPreview variant="focus" tilt="right" />
      </div>
    </div>
  );
}
