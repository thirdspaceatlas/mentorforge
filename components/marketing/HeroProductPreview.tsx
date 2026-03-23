/**
 * Static marketing preview — not connected to planner state.
 * Suggests the real product UI without embedding app logic.
 */
export function HeroProductPreview() {
  return (
    <div className="mx-auto mt-14 w-full max-w-lg px-1 sm:mt-16">
      <div className="rounded-2xl border border-slate-200/95 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.03] dark:border-slate-700/90 dark:bg-slate-900/80 dark:ring-white/[0.04] sm:p-6">
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
          <span className="inline-flex shrink-0 items-center rounded-full border border-emerald-200/90 bg-emerald-50/90 px-2.5 py-1 text-[0.7rem] font-medium text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/60 dark:text-emerald-100">
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
      </div>
    </div>
  );
}
