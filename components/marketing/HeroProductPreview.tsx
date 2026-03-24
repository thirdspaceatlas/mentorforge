import clsx from "clsx";

export type HeroPreviewVariant = "overview" | "focus";

/** Primary (left): stronger lift — matches ~0 8px 32px rgba(0,0,0,0.10) */
const cardShellPrimary =
  "rounded-2xl border border-slate-200/95 bg-white p-6 ring-1 ring-slate-900/[0.05] " +
  "shadow-[0_8px_32px_rgba(0,0,0,0.10),0_2px_8px_rgba(15,23,42,0.06)] " +
  "dark:border-slate-500/50 dark:bg-slate-900/95 dark:shadow-[0_12px_40px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.06)] " +
  "sm:p-7 sm:scale-[1.02] sm:transform-gpu";

/** Secondary (right): lighter shadow, “peeking” — ~0 4px 16px rgba(0,0,0,0.07) */
const cardShellSecondary =
  "rounded-2xl border border-slate-200/90 bg-white p-6 ring-1 ring-slate-900/[0.03] " +
  "shadow-[0_4px_16px_rgba(0,0,0,0.07),0_1px_4px_rgba(15,23,42,0.04)] " +
  "dark:border-slate-600/70 dark:bg-slate-900/90 dark:shadow-[0_6px_24px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.04)] " +
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
  /** Primary = stronger shadow & scale; secondary = lighter */
  role?: "primary" | "secondary";
  tilt?: "left" | "right" | "none";
  className?: string;
};

export function HeroProductPreview({
  variant = "overview",
  role = "primary",
  tilt = "right",
  className
}: HeroProductPreviewProps) {
  const shell = role === "primary" ? cardShellPrimary : cardShellSecondary;
  const tiltClass =
    tilt === "left"
      ? "sm:-rotate-[1.5deg]"
      : tilt === "right"
        ? "sm:rotate-[1.5deg]"
        : "";

  return (
    <div className={clsx("w-full", className)}>
      <div className={clsx(shell, tiltClass)}>
        {variant === "overview" ? <OverviewCard /> : <FocusCard />}
      </div>
    </div>
  );
}

export function HeroProductPreviews() {
  return (
    <div className="mx-auto mt-14 w-full min-w-0 max-w-5xl px-4 sm:mt-16 sm:px-6">
      {/* Mobile: stack, full width, no stagger */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-start md:gap-x-4 md:gap-y-0 lg:gap-x-8">
        <div className="relative z-20 md:z-30">
          <HeroProductPreview variant="overview" role="primary" tilt="left" />
        </div>
        <div className="relative z-10 md:-ml-4 md:mt-8 lg:-ml-8 lg:mt-10">
          <HeroProductPreview variant="focus" role="secondary" tilt="right" />
        </div>
      </div>
    </div>
  );
}
