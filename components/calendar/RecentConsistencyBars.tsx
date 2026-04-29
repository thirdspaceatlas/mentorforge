"use client";

import {
  MAX_BAR_MIN,
  TARGET_MIN,
  coachCopy,
  formatDecimalHours,
  summarize,
  type ConsistencyDay,
} from "@/lib/calendar/recent-consistency";

/**
 * Recent-consistency chart — bar chart of minutes per day for the last N days
 * (typically 16). Streak-free by design: studied days are ink, today gets
 * amber + halo, quiet days get a hairline tick at the baseline (no rust dots,
 * no punishment language). Above-target days are positively framed via the
 * 60m target line and the "Above target days" stat.
 */
export function RecentConsistencyBars({ days }: { days: ConsistencyDay[] }) {
  if (days.length === 0) return null;
  const s = summarize(days);
  const decimalHours = formatDecimalHours(s.totalMinutes);

  return (
    <div className="grid gap-8 sm:grid-cols-[1fr_minmax(0,260px)]">
      {/* LEFT — bars + axis */}
      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[12.5px] text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-ink dark:text-slate-100">
              {s.daysStudied} of {s.total}
            </span>{" "}
            days. <span className="font-mono tabular-nums">{decimalHours}</span>{" "}
            logged.
          </p>
          <p className="text-right font-mono text-[10.5px] uppercase leading-relaxed tracking-[0.06em] text-slate-500 dark:text-slate-400">
            {s.rangeLabel}
          </p>
        </div>

        {/* Bars area */}
        <div className="relative mt-7 h-[130px]">
          {/* Baseline */}
          <div
            className="absolute bottom-7 left-0 right-0 border-t border-hair"
            aria-hidden
          />

          {/* Target line at 60m (= 50% of 120m max) */}
          <div
            className="absolute left-0 right-0 border-t border-dashed border-hair"
            style={{ bottom: 28 + (TARGET_MIN / MAX_BAR_MIN) * 80 }}
            aria-hidden
          />
          <span
            className="absolute right-0 font-mono text-[9px] uppercase tracking-[0.04em] text-slate-500 dark:text-slate-400"
            style={{
              bottom: 28 + (TARGET_MIN / MAX_BAR_MIN) * 80 + 2,
            }}
            aria-hidden
          >
            target · {TARGET_MIN}m
          </span>

          {/* Bars grid */}
          <div
            className="absolute inset-0 grid items-end gap-1.5 pb-7"
            style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
            role="list"
          >
            {days.map((d, i) => (
              <DayBar
                key={d.date}
                day={d}
                index={i}
                isToday={i === s.todayIndex}
                isBest={i === s.bestIndex && d.minutes > 0}
              />
            ))}
          </div>

          {/* Day labels at the baseline */}
          <div
            className="absolute bottom-0 left-0 right-0 grid gap-1.5 pt-2"
            style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
            aria-hidden
          >
            {days.map((d, i) => (
              <DayLabel
                key={d.date}
                date={d.date}
                isToday={i === s.todayIndex}
              />
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — stats + coach note */}
      <div className="space-y-4 sm:border-l sm:border-hair sm:pl-7 dark:sm:border-slate-700">
        <Stat
          label="Days studied (last 16)"
          value={`${s.daysStudied}`}
          unit={`/ ${s.total}`}
          hint={
            s.bestIndex != null && days[s.bestIndex].minutes > 0
              ? `Best day · ${formatBestHint(days[s.bestIndex])}`
              : undefined
          }
        />
        <Stat
          label="Hours logged"
          value={decimalHours.replace(/h$/, "")}
          unit="h"
          hint={`Avg ${avgPerStudiedDay(s)} per studied day`}
        />
        <Stat
          label="Above target days"
          value={`${s.aboveTargetDays}`}
          unit={`/ ${s.total}`}
          hint={`≥ ${TARGET_MIN} min`}
          tone="amber"
        />

        <div className="rounded-md border border-hair bg-paper px-3.5 py-3 dark:border-slate-700 dark:bg-slate-800/40">
          <p className="font-display text-[14px] italic leading-relaxed text-slate-700 dark:text-slate-300">
            {coachCopy(s)}
          </p>
          <p className="mt-1.5 font-mono text-[9.5px] uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
            Coach note
          </p>
        </div>
      </div>
    </div>
  );
}

function DayBar({
  day,
  index,
  isToday,
  isBest,
}: {
  day: ConsistencyDay;
  index: number;
  isToday: boolean;
  isBest: boolean;
}) {
  const studied = day.minutes > 0;
  const heightPx = studied
    ? Math.max(4, (day.minutes / MAX_BAR_MIN) * 80)
    : 2;

  let cls = "relative w-full rounded-sm";
  if (isToday) cls += " bg-amber-mf";
  else if (studied) cls += " bg-ink dark:bg-slate-200";
  else cls += " bg-hair";

  const aria = studied
    ? `${day.date}, ${day.minutes} minutes`
    : `${day.date}, no study`;

  return (
    <div
      role="listitem"
      className="flex h-full flex-col items-center justify-end"
      title={aria}
      aria-label={aria}
    >
      {isBest && (
        <span className="mb-1 font-mono text-[8.5px] font-bold uppercase tracking-[0.05em] text-slate-600 dark:text-slate-300">
          ★ best
        </span>
      )}
      <div
        className={cls}
        style={{ height: `${heightPx}px` }}
      >
        {isToday && studied && (
          <span
            aria-hidden
            className="absolute left-1/2 top-[-10px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-amber-mf shadow-[0_0_0_3px_rgb(244_232_210)] dark:shadow-[0_0_0_3px_rgb(54_40_18)]"
          />
        )}
      </div>
      {/* Index hidden — kept for stable SR navigation */}
      <span className="sr-only">{index + 1}</span>
    </div>
  );
}

function DayLabel({
  date,
  isToday,
}: {
  date: string;
  isToday: boolean;
}) {
  const d = parseDateKey(date);
  const weekday = d
    .toLocaleDateString("en-US", { weekday: "short" })
    .charAt(0);
  return (
    <span
      className={
        "flex flex-col items-center font-mono text-[10px] tabular-nums " +
        (isToday
          ? "font-bold text-ink dark:text-slate-100"
          : "text-slate-500 dark:text-slate-400")
      }
    >
      <span className="text-[8.5px] opacity-60">{weekday}</span>
      <span>{d.getDate()}</span>
    </span>
  );
}

function Stat({
  label,
  value,
  unit,
  hint,
  tone,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  tone?: "amber";
}) {
  const valueCls =
    tone === "amber"
      ? "text-amber-mf"
      : "text-ink dark:text-slate-100";
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 flex items-baseline gap-2">
        <span
          className={
            "font-display text-[36px] font-medium leading-none tracking-tight " +
            valueCls
          }
        >
          {value}
        </span>
        {unit && (
          <span className="font-display text-[18px] italic text-slate-500 dark:text-slate-400">
            {unit}
          </span>
        )}
      </p>
      {hint && (
        <p className="mt-1 text-[11.5px] text-slate-600 dark:text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
}

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function avgPerStudiedDay(s: ReturnType<typeof summarize>): string {
  if (s.daysStudied === 0) return "0 min";
  return `${Math.round(s.totalMinutes / s.daysStudied)} min`;
}

function formatBestHint(day: ConsistencyDay): string {
  const d = parseDateKey(day.date);
  const mo = d.toLocaleDateString("en-US", { month: "short" });
  return `${day.minutes} min · ${mo} ${d.getDate()}`;
}
