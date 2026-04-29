"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DAY_END,
  DAY_START,
  HOUR_TICKS,
  formatHourLabel,
  hourOfDay,
  inRibbonRange,
  xfor,
} from "@/lib/calendar/ribbon";

type RibbonStatus = "done" | "current" | "upcoming" | "missed";

export type RibbonWindow = {
  id: string;
  topicName: string | null;
  startTime: string;
  durationMin: number;
  status: RibbonStatus;
};

export function DayRibbon({
  windows,
  highlightId,
}: {
  windows: RibbonWindow[];
  highlightId: string | null;
}) {
  const router = useRouter();

  const [nowH, setNowH] = useState<number>(() => {
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  });

  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setNowH(d.getHours() + d.getMinutes() / 60);
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const sorted = [...windows].sort(
    (a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const nowPct = xfor(nowH);
  const showNow = inRibbonRange(nowH);

  return (
    <div
      className="relative mt-7 h-[140px]"
      aria-label={`Today's session timeline from ${DAY_START}:00 to ${DAY_END}:00`}
    >
      {/* Hour ticks + labels */}
      {HOUR_TICKS.map((h) => {
        const pct = xfor(h);
        return (
          <div
            key={h}
            className="absolute top-[60px]"
            style={{ left: `${pct}%` }}
            aria-hidden
          >
            <div className="h-1.5 border-l border-hair" />
            <span className="mt-1.5 block -translate-x-1/2 font-mono text-[10px] text-slate-500 dark:text-slate-400">
              {formatHourLabel(h)}
            </span>
          </div>
        );
      })}

      {/* Spine */}
      <div
        className="absolute left-0 right-0 top-[60px] border-t border-hair"
        aria-hidden
      />

      {/* "Done so far" — ink line from edge to NOW */}
      {showNow && (
        <div
          className="absolute top-[59px] h-[3px] rounded-full bg-ink dark:bg-slate-200"
          style={{ left: 0, width: `${nowPct}%` }}
          aria-hidden
        />
      )}

      {/* Session pills — alternate above/below the spine by index */}
      {sorted.map((w, i) => (
        <SessionPill
          key={w.id}
          window={w}
          isHighlight={w.id === highlightId}
          above={i % 2 === 0}
          onClick={
            w.status === "done" || w.status === "missed"
              ? undefined
              : () => router.push(`/app/session/${w.id}`)
          }
        />
      ))}

      {/* NOW indicator — amber line + dot + label */}
      {showNow && (
        <div
          className="pointer-events-none absolute"
          style={{ left: `${nowPct}%`, top: 0, height: 132 }}
          aria-hidden
        >
          <div className="absolute left-1/2 top-[-22px] -translate-x-1/2 font-mono text-[9.5px] font-bold tracking-[0.06em] text-amber-mf">
            NOW
          </div>
          <div className="absolute left-1/2 top-[-4px] h-2 w-2 -translate-x-1/2 rounded-full bg-amber-mf shadow-[0_2px_6px_rgb(201_132_43_/_0.4)]" />
          <div className="absolute left-[-1px] top-0 h-full w-[1.5px] bg-amber-mf" />
        </div>
      )}
    </div>
  );
}

function SessionPill({
  window: w,
  isHighlight,
  above,
  onClick,
}: {
  window: RibbonWindow;
  isHighlight: boolean;
  above: boolean;
  onClick: (() => void) | undefined;
}) {
  const start = hourOfDay(w.startTime);
  const end = start + w.durationMin / 60;
  const rawLeft = xfor(start);
  const widthPct = Math.max(0, xfor(end) - rawLeft);
  // Pill has CSS minWidth: 86px ≈ ~10% on a typical desktop container. Clamp
  // the left position so a pill near the right edge slides in rather than
  // overflowing and clipping its label.
  const MIN_PILL_PCT = 10;
  const effectiveWidth = Math.max(widthPct, MIN_PILL_PCT);
  const left = Math.min(rawLeft, Math.max(0, 100 - effectiveWidth));
  const width = widthPct;
  const interactive = !!onClick;

  let style = "";
  if (w.status === "done") {
    style =
      "bg-ink text-white dark:bg-slate-200 dark:text-slate-900 border border-transparent";
  } else if (w.status === "missed") {
    // Streak-free thesis: missed renders neutrally — present, not punished.
    // Muted slate fill with reduced contrast text. No "missed" word, no rust.
    style =
      "bg-slate-300/70 text-slate-600 dark:bg-slate-700/60 dark:text-slate-400 border border-transparent";
  } else if (isHighlight) {
    style =
      "bg-amber-mf text-ink border border-amber-mf shadow-[0_8px_18px_rgb(201_132_43_/_0.35)]";
  } else {
    style =
      "border-[1.5px] border-dashed border-hair text-slate-700 dark:text-slate-300 dark:border-slate-700";
  }

  const startLabel = new Date(w.startTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const tooltip = `${new Date(w.startTime).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })} · ${w.topicName ?? "Study session"} · ${w.durationMin} min`;

  const inner = (
    <>
      <div className="flex items-center gap-1 font-mono text-[9.5px] font-bold tracking-[0.04em]">
        {isHighlight && (
          <span className="rounded bg-ink/20 px-1 py-px text-[9px] font-bold leading-none">
            NEXT
          </span>
        )}
        {w.status === "done" && (
          <svg
            width="9"
            height="9"
            viewBox="0 0 9 9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M2 5l2 2 3-4" />
          </svg>
        )}
        {startLabel}
      </div>
      <div
        className={
          "truncate text-[11px] " +
          (isHighlight ? "font-semibold" : "font-medium")
        }
      >
        {w.topicName ?? "Study session"}
      </div>
    </>
  );

  const positional: React.CSSProperties = {
    left: `${left}%`,
    width: `${width}%`,
    minWidth: 86,
    top: above ? 8 : 78,
  };

  const baseCls =
    "absolute flex h-[42px] flex-col justify-center overflow-hidden rounded-md px-2 text-left " +
    style;

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={tooltip}
        aria-label={tooltip}
        className={
          baseCls +
          " cursor-pointer transition-transform hover:scale-[1.02] [-webkit-tap-highlight-color:transparent]"
        }
        style={positional}
      >
        {inner}
      </button>
    );
  }

  return (
    <div
      className={baseCls}
      style={positional}
      title={tooltip}
      aria-label={tooltip}
    >
      {inner}
    </div>
  );
}
