"use client";

import { useMemo, useState } from "react";

const todayISO = () => new Date().toISOString().slice(0, 10);

type PlanStatus = "On Track" | "Tight" | "At Risk";

type CfaLevel = "I" | "II" | "III";

/** Level III specialized pathways — wording aligned with CFA Institute (Level III pathways). */
type LevelIIIPathway = "privateWealth" | "privateMarkets" | "portfolioManagement";

const LEVEL_III_PATHWAY_LABEL: Record<LevelIIIPathway, string> = {
  privateWealth: "Private Wealth",
  privateMarkets: "Private Markets",
  portfolioManagement: "Portfolio Management"
};

type PlanSummary = {
  planWeeks: number;
  totalAvailableHours: number;
  targetHours: number;
  requiredWeeklyHours: number;
  status: PlanStatus;
  cfaLevel: CfaLevel;
  /** Set when cfaLevel is III; matches registration pathway choice. */
  levelIIIPathway: LevelIIIPathway | null;
  examWindowLabel: string;
  readinessNote: string;
  /** Next CFA exam window after the selected one (same level), if any. */
  suggestedNextWindowLabel: string | null;
  /** Calendar week (aligned to user's week start) containing study days before the exam window. */
  finalReviewWeekLabel: string;
};

type WeekStatus = "not-started" | "partial" | "complete";

type WeekPlan = {
  week: number;
  topic: string;
  plannedHours: number;
  startDate: Date;
  endDate: Date;
  startDateLabel: string;
  endDateLabel: string;
  daysInWeek: number;
  rebalancedExtraHours: number;
};

const toLocalMidnight = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** First day of the calendar week (weekStartDay) that contains `d`. */
const alignWeekStartOnOrBefore = (d: Date, weekStartDay: string) => {
  const targetDow = Number(weekStartDay);
  const base = new Date(d);
  const currentDow = base.getDay();
  const diff = (currentDow - targetDow + 7) % 7;
  base.setDate(base.getDate() - diff);
  return base;
};

/** Week before the exam window opens: the 7-day block aligned to week start that contains the day before your window. */
const getFinalReviewWeekLabel = (examISO: string, weekStartDay: string) => {
  const exam = toLocalMidnight(examISO);
  const dayBefore = new Date(exam);
  dayBefore.setDate(dayBefore.getDate() - 1);
  const weekStart = alignWeekStartOnOrBefore(dayBefore, weekStartDay);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const y = weekStart.getFullYear();
  return `${formatDateLabel(weekStart)} – ${formatDateLabel(weekEnd)}, ${y}`;
};

const formatDateLabel = (d: Date) =>
  d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });

/** Rough planning benchmarks (hours) — placeholder for MVP */
const CFA_LEVEL_BENCHMARK: Record<CfaLevel, number> = {
  I: 300,
  II: 325,
  III: 350
};

/**
 * Exam window (first day of testing window). Dates follow typical CFA schedules by level;
 * confirm exact windows each year at cfainstitute.org/programs/cfa-program/dates-fees.
 */
type ExamWindow = {
  id: string;
  label: string;
  startISO: string;
};

/** How many calendar years of windows to generate starting from the current year. */
const EXAM_WINDOW_YEAR_SPAN = 3;

type ExamWindowTemplate = {
  month: number;
  day: number;
  label: (year: number) => string;
};

const EXAM_WINDOW_TEMPLATES: Record<CfaLevel, ExamWindowTemplate[]> = {
  I: [
    { month: 2, day: 2, label: (y) => `Feb ${y}` },
    { month: 5, day: 12, label: (y) => `May ${y}` },
    { month: 8, day: 18, label: (y) => `Aug ${y}` },
    { month: 11, day: 11, label: (y) => `Nov ${y}` }
  ],
  II: [
    { month: 5, day: 19, label: (y) => `May ${y}` },
    { month: 8, day: 25, label: (y) => `Aug ${y}` },
    { month: 11, day: 18, label: (y) => `Nov ${y}` }
  ],
  III: [
    { month: 1, day: 29, label: (y) => `Feb ${y}` },
    { month: 8, day: 13, label: (y) => `Aug ${y}` }
  ]
};

const toStartISO = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

/** All synthetic windows for current year through current year + span (for fallback). */
const buildAllExamWindows = (level: CfaLevel): ExamWindow[] => {
  const startYear = new Date().getFullYear();
  const templates = EXAM_WINDOW_TEMPLATES[level];
  const out: ExamWindow[] = [];
  for (let i = 0; i < EXAM_WINDOW_YEAR_SPAN; i++) {
    const year = startYear + i;
    for (const t of templates) {
      const startISO = toStartISO(year, t.month, t.day);
      out.push({
        id: `L${level}-${startISO}`,
        label: t.label(year),
        startISO
      });
    }
  }
  return out.sort((a, b) => a.startISO.localeCompare(b.startISO));
};

/** Upcoming windows only (start date on or after today), sorted. Falls back to full list if none. */
const getExamWindowsSorted = (level: CfaLevel) => {
  const today = todayISO();
  const all = buildAllExamWindows(level);
  const upcoming = all.filter((w) => w.startISO >= today);
  return upcoming.length ? upcoming : all;
};

const getDefaultExamDateForLevel = (level: CfaLevel) => {
  const today = todayISO();
  const all = buildAllExamWindows(level).sort((a, b) =>
    a.startISO.localeCompare(b.startISO)
  );
  const upcoming = all.filter((w) => w.startISO >= today);
  if (upcoming.length) return upcoming[0]!.startISO;
  return all[all.length - 1]!.startISO;
};

const getNextExamWindow = (
  level: CfaLevel,
  currentStartISO: string
): ExamWindow | null => {
  const sorted = getExamWindowsSorted(level);
  return sorted.find((w) => w.startISO > currentStartISO) ?? null;
};

const buildReadinessNote = (args: {
  status: PlanStatus;
  examWindowLabel: string;
  hasNextWindow: boolean;
}): string => {
  const { status, examWindowLabel, hasNextWindow } = args;
  if (status === "On Track") {
    return `You're on track to align with the ${examWindowLabel} exam window at your current weekly hours.`;
  }
  if (hasNextWindow) {
    if (status === "Tight") {
      return `The ${examWindowLabel} window is tight against the planning benchmark. Consider adding weekly hours or selecting a later exam window.`;
    }
    return `At current weekly hours, your plan is below the benchmark for ${examWindowLabel}. Consider increasing study hours or selecting a later exam window.`;
  }
  return `At current weekly hours, your plan is below the benchmark for ${examWindowLabel}. Consider increasing weekly study hours.`;
};

/** Light variation by level (and Level III pathway) — keeps tactics non-status. */
const getStudyTacticsBullets = (
  cfaLevel: CfaLevel,
  levelIIIPathway: LevelIIIPathway | null
): string[] => {
  switch (cfaLevel) {
    case "I":
      return [
        "Mix new readings with practice items and spaced review so topics stick—don't only re-watch lectures.",
        "Level I rewards breadth: balance across topic areas and drill ethics and end-of-reading practice questions.",
        "Track weak LOS areas and revisit them on a short cycle (e.g. weekly mini-reviews).",
        "Reserve your final review week for timed practice, mocks, and high-yield gaps—not new material."
      ];
    case "II":
      return [
        "Mix new readings with practice items and spaced review—then validate with item sets, not only recall.",
        "Level II is vignette-heavy: practice reading long passages and answering linked questions under time.",
        "Track weak LOS areas and revisit them on a short cycle (e.g. weekly mini-reviews).",
        "Reserve your final review week for timed item-set blocks and weak-topic drills—not first passes at new material."
      ];
    case "III": {
      const path = levelIIIPathway ?? "portfolioManagement";
      const pathwayLine =
        path === "privateWealth"
          ? "Private Wealth: practice client narratives, goals-based planning, and family dynamics alongside investment tools."
          : path === "privateMarkets"
          ? "Private Markets: reinforce GP/LP roles, private-market valuation, and deal-cycle vocabulary through practice cases."
          : "Portfolio Management: blend essay-style answers with institutional and public-markets portfolio construction practice.";
      return [
        "Level III mixes essays and item sets: draft short answers under time, not only multiple choice.",
        pathwayLine,
        "Track weak LOS areas and revisit them on a short cycle (e.g. weekly mini-reviews).",
        "Reserve your final review week for timed practice, mocks, and high-yield gaps—not new material."
      ];
    }
  }
};

/** Topic list per level (sequenced by the plan builder). Level III uses pathway-specific topics. */
const PLACEHOLDER_TOPICS: Record<Exclude<CfaLevel, "III">, string[]> = {
  I: [
    "Quantitative Methods",
    "Economics",
    "Financial Statement Analysis",
    "Corporate Issuers",
    "Equity",
    "Fixed Income",
    "Derivatives",
    "Alternative Investments",
    "Portfolio Management",
    "Ethics"
  ],
  II: [
    "Financial Statement Analysis",
    "Quantitative Methods",
    "Equity",
    "Fixed Income",
    "Corporate Issuers",
    "Derivatives",
    "Economics",
    "Alternative Investments",
    "Portfolio Management",
    "Ethics"
  ]
};

/**
 * Pathway-specific placeholder sequence (first weeks follow pathway chapter order).
 * Common core areas (Ethics, derivatives, performance, etc.) appear for later weeks.
 */
const LEVEL_III_PATHWAY_TOPICS: Record<LevelIIIPathway, string[]> = {
  privateWealth: [
    "The Private Wealth management industry",
    "Working with the wealthy",
    "Wealth planning",
    "Investment planning",
    "Preserving the wealth",
    "Advising the wealthy",
    "Transferring the wealth",
    "Ethics (Code of ethics, standards, Asset Manager Code)",
    "Derivatives & risk management",
    "Performance measurement"
  ],
  privateMarkets: [
    "Private investments and structures",
    "GP and LP perspective and the investment process",
    "Private equity",
    "Private debt",
    "Private special situations",
    "Private real estate",
    "Infrastructure",
    "Ethics (Code of ethics, standards, Asset Manager Code)",
    "Derivatives & risk management",
    "Performance measurement"
  ],
  portfolioManagement: [
    "Index-based equity strategies",
    "Active equity investing: strategies",
    "Active equity investing: portfolio construction",
    "Liability driven and index based fixed income strategies",
    "Fixed-income active management: yield curve strategies",
    "Fixed-income active management: credit strategies",
    "Case study in portfolio management: institutional",
    "Trade strategy and execution",
    "Ethics (Code of ethics, standards, Asset Manager Code)",
    "Asset allocation"
  ]
};

const getPlaceholderTopics = (
  cfaLevel: CfaLevel,
  levelIIIPathway: LevelIIIPathway | null
): string[] => {
  if (cfaLevel === "III") {
    const path = levelIIIPathway ?? "portfolioManagement";
    return LEVEL_III_PATHWAY_TOPICS[path];
  }
  return PLACEHOLDER_TOPICS[cfaLevel];
};

/** Approximate CFA exam weight by topic (Level I/II shared names). Unknown topics default to 5. */
const TOPIC_EXAM_WEIGHT: Record<string, number> = {
  "Quantitative Methods": 8,
  "Economics": 8,
  "Financial Statement Analysis": 13,
  "Corporate Issuers": 8,
  "Equity": 12,
  "Fixed Income": 12,
  "Derivatives": 6,
  "Alternative Investments": 6,
  "Portfolio Management": 10,
  "Ethics": 17
};

const isEthicsTopic = (name: string) => name.toLowerCase().includes("ethics");

const isReviewTopic = (name: string) =>
  /review|mocks|weak areas/i.test(name);

/**
 * Place a value in the nearest empty slot to `target`.
 * Returns true if placed successfully.
 */
const placeNearest = (slots: (string | null)[], target: number, value: string): boolean => {
  for (let d = 0; d < slots.length; d++) {
    if (target + d < slots.length && slots[target + d] === null) { slots[target + d] = value; return true; }
    if (target - d >= 0 && slots[target - d] === null) { slots[target - d] = value; return true; }
  }
  return false;
};

/**
 * Sequence topics across weeks with:
 *  1. Weight-aware ordering — heavier core topics placed earlier.
 *  2. Weighted recurrence — topics above a weight threshold get a second
 *     pass later in the plan so the user revisits them.
 *  3. Ethics spacing — introduced early, refreshed at ~45 % and ~80 %.
 *  4. Periodic review — a "Review & Weak Areas" checkpoint every
 *     REVIEW_CADENCE study-weeks for plans long enough.
 *  5. End blocks — "Review & Practice" + "Final Review & Mocks".
 */
const REVIEW_CADENCE = 5;
const RECURRENCE_WEIGHT_THRESHOLD = 10;

const sequenceTopicsForWeeks = (topics: string[], totalWeeks: number): string[] => {
  if (totalWeeks <= 0) return [];
  if (totalWeeks <= 2) {
    return Array.from({ length: totalWeeks }, (_, i) =>
      i === totalWeeks - 1 ? "Final Review & Mocks" : (topics[0] ?? "Review & Practice")
    );
  }

  const slots: (string | null)[] = new Array(totalWeeks).fill(null);

  // --- 1. end blocks ---
  slots[totalWeeks - 1] = "Final Review & Mocks";
  if (totalWeeks >= 8) slots[totalWeeks - 2] = "Review & Practice";

  // --- 2. periodic review checkpoints (every REVIEW_CADENCE study-weeks) ---
  if (totalWeeks >= 10) {
    for (
      let r = REVIEW_CADENCE;
      r < totalWeeks - 2;
      r += REVIEW_CADENCE + 1
    ) {
      if (slots[r] === null) slots[r] = "Review & Weak Areas";
    }
  }

  // --- 3. ethics spacing ---
  const ethicsTopics = topics.filter(isEthicsTopic);
  const coreTopics = topics.filter((t) => !isEthicsTopic(t));

  if (ethicsTopics.length > 0) {
    const ethicsName = ethicsTopics[0];
    const pcts = [0.08, 0.45, 0.8];
    for (let p = 0; p < pcts.length; p++) {
      const target = Math.max(0, Math.min(totalWeeks - 1, Math.round(totalWeeks * pcts[p])));
      placeNearest(slots, target, ethicsName);
      if (totalWeeks < 10 && p >= 1) break;
      if (totalWeeks < 16 && p >= 2) break;
    }
  }

  // --- 4. weight-sorted core topics ---
  const sortedCore = [...coreTopics]
    .map((t, i) => ({ name: t, origIdx: i }))
    .sort((a, b) => {
      const diff = (TOPIC_EXAM_WEIGHT[b.name] ?? 5) - (TOPIC_EXAM_WEIGHT[a.name] ?? 5);
      return diff !== 0 ? diff : a.origIdx - b.origIdx;
    })
    .map((t) => t.name);

  // Heavy topics that deserve a second pass later in the plan
  const heavyTopics = sortedCore.filter(
    (t) => (TOPIC_EXAM_WEIGHT[t] ?? 5) >= RECURRENCE_WEIGHT_THRESHOLD
  );

  // Build a topic queue: primary pass + recurrence pass for heavy topics
  const topicQueue = [...sortedCore];
  if (totalWeeks >= 12 && heavyTopics.length > 0) {
    topicQueue.push(...heavyTopics.map((t) => `${t} (deep dive)`));
  }

  // Fill remaining empty slots from the queue
  const emptySlots = slots.reduce<number[]>((acc, v, i) => {
    if (v === null) acc.push(i);
    return acc;
  }, []);

  for (let i = 0; i < emptySlots.length; i++) {
    const topicIdx = Math.floor((i / emptySlots.length) * topicQueue.length);
    slots[emptySlots[i]] = topicQueue[Math.min(topicIdx, topicQueue.length - 1)];
  }

  return slots.map((s) => s ?? "Review & Practice");
};

/**
 * Build the full week plan from plan start through the day before the exam.
 * Week 1 starts on the user's chosen plan-start date (partial if it doesn't
 * fall on the week-start weekday). Subsequent weeks are full 7-day blocks
 * aligned to the chosen week-start day. The last week may also be partial.
 */
const buildFullWeekPlan = (args: {
  start: Date;
  examDate: Date;
  weekStartDay: string;
  weeklyHours: number;
  cfaLevel: CfaLevel;
  levelIIIPathway: LevelIIIPathway | null;
}): WeekPlan[] => {
  const topics = getPlaceholderTopics(args.cfaLevel, args.levelIIIPathway);
  const safeWeeklyHours = Math.max(1, args.weeklyHours || 0);
  const msPerDay = 24 * 60 * 60 * 1000;
  const planStart = new Date(args.start);
  const planEnd = new Date(args.examDate);
  planEnd.setDate(planEnd.getDate() - 1);

  if (planEnd < planStart) {
    return [{
      week: 1, topic: "Final Review & Mocks", plannedHours: safeWeeklyHours,
      startDate: planStart, endDate: planStart,
      startDateLabel: formatDateLabel(planStart), endDateLabel: formatDateLabel(planStart),
      daysInWeek: 1, rebalancedExtraHours: 0
    }];
  }

  const calWeekStart = alignWeekStartOnOrBefore(planStart, args.weekStartDay);
  const week1End = new Date(calWeekStart);
  week1End.setDate(week1End.getDate() + 6);

  const boundaries: { start: Date; end: Date; days: number }[] = [];
  const end1 = week1End > planEnd ? planEnd : week1End;
  const days1 = Math.round((end1.getTime() - planStart.getTime()) / msPerDay) + 1;
  boundaries.push({ start: new Date(planStart), end: new Date(end1), days: days1 });

  let nextStart = new Date(week1End);
  nextStart.setDate(nextStart.getDate() + 1);
  while (nextStart <= planEnd) {
    const weekEnd = new Date(nextStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const actualEnd = weekEnd > planEnd ? planEnd : weekEnd;
    const days = Math.round((actualEnd.getTime() - nextStart.getTime()) / msPerDay) + 1;
    boundaries.push({ start: new Date(nextStart), end: new Date(actualEnd), days });
    nextStart = new Date(weekEnd);
    nextStart.setDate(nextStart.getDate() + 1);
  }

  const topicSeq = sequenceTopicsForWeeks(topics, boundaries.length);
  return boundaries.map((b, i) => {
    const proratedHours = b.days < 7
      ? Math.max(1, Math.round(safeWeeklyHours * b.days / 7))
      : safeWeeklyHours;
    return {
      week: i + 1, topic: topicSeq[i] ?? "Review & Practice",
      plannedHours: proratedHours, startDate: b.start, endDate: b.end,
      startDateLabel: formatDateLabel(b.start), endDateLabel: formatDateLabel(b.end),
      daysInWeek: b.days, rebalancedExtraHours: 0
    };
  });
};

const getStatusContainerClasses = (status: PlanStatus) => {
  switch (status) {
    case "On Track":
      return "border-emerald-200 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40";
    case "Tight":
      return "border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40";
    case "At Risk":
    default:
      return "border-rose-200 bg-rose-50 dark:border-rose-700 dark:bg-rose-950/40";
  }
};

const getStatusLabelClasses = (status: PlanStatus) => {
  switch (status) {
    case "On Track":
      return "text-emerald-700 dark:text-emerald-300";
    case "Tight":
      return "text-amber-700 dark:text-amber-300";
    case "At Risk":
    default:
      return "text-rose-700 dark:text-rose-300";
  }
};

const getStatusValueClasses = (status: PlanStatus) => {
  switch (status) {
    case "On Track":
      return "text-emerald-800 dark:text-emerald-200";
    case "Tight":
      return "text-amber-800 dark:text-amber-200";
    case "At Risk":
    default:
      return "text-rose-800 dark:text-rose-200";
  }
};

const getWeekStatus = (actual: number | null, planned: number): WeekStatus => {
  if (actual != null && actual >= planned) return "complete";
  if (actual != null && actual > 0) return "partial";
  return "not-started";
};

const weekStatusPill = (status: WeekStatus) => {
  switch (status) {
    case "complete":
      return { label: "Complete", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" };
    case "partial":
      return { label: "Partial", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" };
    default:
      return { label: "Not started", cls: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400" };
  }
};

const WEEKDAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const VISIBLE_WEEKS_DEFAULT = 4;

/**
 * Single source of truth for building / recomputing the summary.
 * Called by handleSubmit (initial build) and after rebalance / undo / reset.
 *
 * Two "remaining" lenses:
 *  - calendarRemaining  – weeks whose endDate >= today (calendar runway)
 *  - progressRemaining  – weeks with no actual hours logged (untouched work)
 *
 * requiredWeeklyHours uses progressRemaining; status uses calendarRemaining.
 */
type BuildSummaryInput = {
  plan: WeekPlan[];
  actuals: (number | null)[];
  weeklyHoursAvail: number;
  targetHours: number;
  cfaLevel: CfaLevel;
  levelIIIPathway: LevelIIIPathway | null;
  examWindowLabel: string;
  suggestedNextWindowLabel: string | null;
  finalReviewWeekLabel: string;
};

const buildSummary = (input: BuildSummaryInput): PlanSummary => {
  const {
    plan, actuals, weeklyHoursAvail, targetHours,
    cfaLevel, levelIIIPathway,
    examWindowLabel, suggestedNextWindowLabel, finalReviewWeekLabel
  } = input;

  const totalWeeks = plan.length;
  const totalAvailableHours = plan.reduce((s, w) => s + w.plannedHours, 0);
  const completedHours = actuals.reduce<number>((s, a) => s + (a ?? 0), 0);
  const remainingTarget = Math.max(0, targetHours - completedHours);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const calendarRemaining = plan.filter((w) => w.endDate >= today).length;
  const progressRemaining = plan.filter((_, i) => actuals[i] == null).length;

  const requiredWeeklyHours = progressRemaining > 0
    ? Math.ceil(remainingTarget / progressRemaining)
    : totalWeeks > 0
    ? Math.ceil(targetHours / totalWeeks)
    : 0;

  const calendarCapacity = calendarRemaining * weeklyHoursAvail;
  const ratio = remainingTarget > 0 ? calendarCapacity / remainingTarget : 1;

  const status: PlanStatus =
    ratio >= 1 ? "On Track" : ratio >= 0.7 ? "Tight" : "At Risk";

  const readinessNote = buildReadinessNote({
    status,
    examWindowLabel,
    hasNextWindow: suggestedNextWindowLabel != null
  });

  return {
    planWeeks: totalWeeks,
    totalAvailableHours,
    targetHours,
    requiredWeeklyHours,
    status,
    cfaLevel,
    levelIIIPathway,
    examWindowLabel,
    readinessNote,
    suggestedNextWindowLabel,
    finalReviewWeekLabel
  };
};

export default function HomePage() {
  const [examDate, setExamDate] = useState(() =>
    getDefaultExamDateForLevel("I")
  );
  const [weeklyHours, setWeeklyHours] = useState<number | "">(8);
  const weeklyHoursNum = weeklyHours === "" ? 0 : weeklyHours;
  const [planStartDate, setPlanStartDate] = useState(() => todayISO());
  const [weekStartDay, setWeekStartDay] = useState("1");
  const [formError, setFormError] = useState<string | null>(null);
  const [summary, setSummary] = useState<PlanSummary | null>(null);
  const [baseWeekPlan, setBaseWeekPlan] = useState<WeekPlan[] | null>(null);
  const [weekPlan, setWeekPlan] = useState<WeekPlan[] | null>(null);
  const [actualHours, setActualHours] = useState<(number | null)[]>([]);
  const [rebalanceMessage, setRebalanceMessage] = useState<string | null>(null);
  const [examLevel, setExamLevel] = useState<CfaLevel>("I");
  const [levelIIIPathway, setLevelIIIPathway] =
    useState<LevelIIIPathway>("portfolioManagement");
  const [showAllWeeks, setShowAllWeeks] = useState(false);

  const examWindows = useMemo(() => getExamWindowsSorted(examLevel), [examLevel]);

  const makeSummaryInput = (plan: WeekPlan[], actuals: (number | null)[]): BuildSummaryInput => ({
    plan,
    actuals,
    weeklyHoursAvail: weeklyHoursNum,
    targetHours: CFA_LEVEL_BENCHMARK[examLevel],
    cfaLevel: examLevel,
    levelIIIPathway: examLevel === "III" ? levelIIIPathway : null,
    examWindowLabel: summary?.examWindowLabel ?? "Selected exam window",
    suggestedNextWindowLabel: summary?.suggestedNextWindowLabel ?? null,
    finalReviewWeekLabel: summary?.finalReviewWeekLabel ?? ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setRebalanceMessage(null);
    setShowAllWeeks(false);

    if (!planStartDate || !examDate) {
      setFormError("Please select both dates.");
      setSummary(null);
      setBaseWeekPlan(null);
      setWeekPlan(null);
      setActualHours([]);
      return;
    }

    const start = toLocalMidnight(planStartDate);
    const exam = toLocalMidnight(examDate);

    if (!(exam.getTime() > start.getTime())) {
      setFormError("Exam date must be after the plan start date.");
      setSummary(null);
      setBaseWeekPlan(null);
      setWeekPlan(null);
      setActualHours([]);
      return;
    }

    const newWeekPlan = buildFullWeekPlan({
      start,
      examDate: exam,
      weekStartDay,
      weeklyHours: weeklyHoursNum,
      cfaLevel: examLevel,
      levelIIIPathway: examLevel === "III" ? levelIIIPathway : null
    });

    const freshActuals: (number | null)[] = new Array(newWeekPlan.length).fill(null);
    const selectedWindow = examWindows.find((w) => w.startISO === examDate);
    const nextWin = getNextExamWindow(examLevel, examDate);

    setSummary(
      buildSummary({
        plan: newWeekPlan,
        actuals: freshActuals,
        weeklyHoursAvail: weeklyHoursNum,
        targetHours: CFA_LEVEL_BENCHMARK[examLevel],
        cfaLevel: examLevel,
        levelIIIPathway: examLevel === "III" ? levelIIIPathway : null,
        examWindowLabel: selectedWindow?.label ?? "Selected exam window",
        suggestedNextWindowLabel: nextWin?.label ?? null,
        finalReviewWeekLabel: getFinalReviewWeekLabel(examDate, weekStartDay)
      })
    );

    setBaseWeekPlan(newWeekPlan);
    setWeekPlan(newWeekPlan);
    setActualHours(freshActuals);
  };

  const rebalanceActive = weekPlan?.some((w) => w.rebalancedExtraHours > 0) ?? false;
  const futureAvgLoad = (() => {
    if (!weekPlan || !rebalanceActive) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const future = weekPlan.filter((w) => w.endDate >= now);
    if (future.length === 0) return null;
    return Math.round(future.reduce((s, w) => s + w.plannedHours, 0) / future.length);
  })();

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="max-w-xl text-xl font-medium uppercase leading-snug tracking-[0.08em] text-slate-700 dark:text-slate-200 sm:text-2xl sm:tracking-[0.06em]">
          Forge a realistic CFA study plan
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Turn your exam date and available hours into a study plan built for real life.
        </p>
      </section>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/60 p-4"
      >
        {formError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
            {formError}
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
            Exam
          </label>
          <div
            className="flex rounded-md border border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/50 p-0.5"
            role="group"
            aria-label="CFA exam level"
          >
            {(["I", "II", "III"] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => {
                  setExamLevel(level);
                  setExamDate(getDefaultExamDateForLevel(level));
                }}
                className={
                  "flex-1 rounded px-3 py-2 text-sm font-medium transition-colors " +
                  (examLevel === level
                    ? "bg-sky-500 text-slate-950"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/80")
                }
              >
                Level {level}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Switch levels to match your exam; benchmarks and preview topics update
            when you build a plan.
          </p>
        </div>

        {examLevel === "III" ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Level III specialized pathway
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Candidates choose one pathway at registration (Private Wealth, Private
              Markets, or Portfolio Management); pathways cannot be changed once
              registration is completed. Match the pathway you selected.
            </p>
            <div
              className="flex flex-col gap-1 rounded-md border border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/50 p-0.5 sm:flex-row"
              role="group"
              aria-label="Level III specialized pathway"
            >
              {(
                [
                  "privateWealth",
                  "privateMarkets",
                  "portfolioManagement"
                ] as const
              ).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setLevelIIIPathway(key)}
                  className={
                    "rounded px-3 py-2 text-left text-sm font-medium transition-colors sm:flex-1 sm:text-center " +
                    (levelIIIPathway === key
                      ? "bg-sky-500 text-slate-950"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/80")
                  }
                >
                  {LEVEL_III_PATHWAY_LABEL[key]}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Exam window
            </label>
            <select
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 dark:text-slate-100"
              required
            >
              {examWindows.map((w) => (
                <option key={w.id} value={w.startISO}>
                  {w.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Lists upcoming exam windows from the current calendar year forward (
              {EXAM_WINDOW_YEAR_SPAN} years), using typical schedules by level—verify
              exact dates at cfainstitute.org/programs/cfa-program/dates-fees.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Plan start date
            </label>
            <input
              type="date"
              value={planStartDate}
              onChange={(e) => setPlanStartDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 dark:text-slate-100"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Available study hours per week
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={weeklyHours === "" ? "" : weeklyHours}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  setWeeklyHours("");
                  return;
                }
                const next = Number(value);
                if (Number.isNaN(next)) return;
                setWeeklyHours(next);
              }}
              className="w-full rounded-md border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 dark:text-slate-100"
              required
            />
            <p className="text-sm text-slate-500 dark:text-slate-400">Be realistic, not ideal.</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Week starts on
            </label>
            <select
              value={weekStartDay}
              onChange={(e) => setWeekStartDay(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 dark:text-slate-100"
            >
              <option value="0">Sunday</option>
              <option value="1">Monday</option>
              <option value="2">Tuesday</option>
              <option value="3">Wednesday</option>
              <option value="4">Thursday</option>
              <option value="5">Friday</option>
              <option value="6">Saturday</option>
            </select>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              This aligns your weekly study schedule and date ranges.
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
        >
          Build my plan
        </button>
      </form>

      {summary ? (
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/60 p-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Plan summary</h2>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/40 p-3 sm:col-span-2">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Exam window & testing readiness
              </div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {summary.examWindowLabel}
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{summary.readinessNote}</p>
              <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Final review week (target)
              </div>
              <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {summary.finalReviewWeekLabel}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                The week aligned to your &quot;Week starts on&quot; setting that
                contains the last study days before your exam window opens. Use it
                for mocks, weak-area drills, and light review—not new material.
              </p>
              {summary.suggestedNextWindowLabel &&
              summary.status !== "On Track" ? (
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  Next scheduled window after this one:{" "}
                  <span className="font-medium text-slate-500 dark:text-slate-400">
                    {summary.suggestedNextWindowLabel}
                  </span>
                </p>
              ) : null}
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/40 p-3">
              <div className="text-sm text-slate-500 dark:text-slate-400">Study weeks in plan</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {summary.planWeeks}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/40 p-3">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Total available study hours
              </div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {summary.totalAvailableHours}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/40 p-3">
              <div className="text-sm text-slate-500 dark:text-slate-400">Planning benchmark</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {summary.targetHours}
              </div>
            </div>

            <div
              className={
                "rounded-lg border p-3 " + getStatusContainerClasses(summary.status)
              }
            >
              <div
                className={"text-sm " + getStatusLabelClasses(summary.status)}
              >
                Status
              </div>
              <div
                className={
                  "text-lg font-semibold " + getStatusValueClasses(summary.status)
                }
              >
                {summary.status}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/40 p-3 sm:col-span-2">
              <div className="text-sm text-slate-500 dark:text-slate-400">Weekly hours breakdown</div>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Benchmark pace</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{summary.requiredWeeklyHours} hrs/wk</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Your planned pace</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{weeklyHoursNum} hrs/wk</span>
                </div>
                {futureAvgLoad != null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300">Current future load</span>
                    <span className="font-semibold text-amber-700 dark:text-amber-300">{futureAvgLoad} hrs/wk</span>
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Benchmark pace is the weekly load to reach the {summary.targetHours}-hour target.
                {weeklyHoursNum < summary.requiredWeeklyHours
                  ? ` You need ~${summary.requiredWeeklyHours - weeklyHoursNum} more hour${summary.requiredWeeklyHours - weeklyHoursNum === 1 ? "" : "s"}/wk to match it.`
                  : weeklyHoursNum === summary.requiredWeeklyHours
                  ? " Your planned pace matches the benchmark."
                  : ` You have ~${weeklyHoursNum - summary.requiredWeeklyHours} extra hour${weeklyHoursNum - summary.requiredWeeklyHours === 1 ? "" : "s"}/wk above it.`}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/60 p-3 text-sm text-slate-800 dark:text-slate-200">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Study tactics
            </h3>
            <ul className="list-inside list-disc space-y-1 text-slate-600 dark:text-slate-300">
              {getStudyTacticsBullets(
                summary.cfaLevel,
                summary.levelIIIPathway
              ).map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>

          </div>

          {weekPlan ? (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Study plan{" "}
                  <span className="ml-1 text-xs font-normal text-slate-500 dark:text-slate-400">
                    {showAllWeeks || weekPlan.length <= VISIBLE_WEEKS_DEFAULT
                      ? `${weekPlan.length} week${weekPlan.length === 1 ? "" : "s"}`
                      : `Weeks 1–${VISIBLE_WEEKS_DEFAULT} of ${weekPlan.length}`}
                  </span>
                </h3>
                {weekPlan.length > VISIBLE_WEEKS_DEFAULT && (
                  <button
                    type="button"
                    onClick={() => setShowAllWeeks(!showAllWeeks)}
                    className="text-xs font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300"
                  >
                    {showAllWeeks ? "Show less" : `View all ${weekPlan.length} weeks`}
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Plan starts {weekPlan[0].startDateLabel}
                {weekPlan[0].daysInWeek < 7
                  ? ` (${weekPlan[0].daysInWeek}-day partial first week)`
                  : ""}
                . Week blocks align to {WEEKDAY_LABELS[Number(weekStartDay)]}.
              </p>

              <div className="grid gap-3 md:grid-cols-2">
                {(showAllWeeks
                  ? weekPlan
                  : weekPlan.slice(0, VISIBLE_WEEKS_DEFAULT)
                ).map((week) => {
                  const idx = week.week - 1;
                  const wStatus = getWeekStatus(actualHours[idx] ?? null, week.plannedHours);
                  const pill = weekStatusPill(wStatus);
                  return (
                    <div
                      key={week.week}
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/40 p-3"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            Week {week.week}
                          </span>
                          <span
                            className={
                              "rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none " +
                              pill.cls
                            }
                          >
                            {pill.label}
                          </span>
                          {week.daysInWeek < 7 && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              ({week.daysInWeek}d)
                            </span>
                          )}
                        </div>
                        <div className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                          {week.startDateLabel} – {week.endDateLabel}
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-slate-800 dark:text-slate-200">
                        {week.topic}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {week.plannedHours} planned hour{week.plannedHours === 1 ? "" : "s"}
                      </div>
                      {week.rebalancedExtraHours > 0 ? (
                        <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                          +{week.rebalancedExtraHours} rebalanced hour
                          {week.rebalancedExtraHours === 1 ? "" : "s"}
                        </div>
                      ) : null}
                      <div className="mt-2 space-y-1">
                        <label className="text-xs text-slate-500 dark:text-slate-400">
                          Actual hours completed
                        </label>
                        <input
                          type="number"
                          min={0}
                          className="w-full rounded-md border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 px-2 py-1 text-xs text-slate-900 outline-none focus:border-sky-500 dark:text-slate-100"
                          value={actualHours[idx] ?? ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            const next = [...actualHours];
                            while (next.length <= idx) next.push(null);
                            if (value === "") {
                              next[idx] = null;
                            } else {
                              const n = Number(value);
                              if (Number.isNaN(n) || n < 0) return;
                              next[idx] = n;
                            }
                            setActualHours(next);
                            setRebalanceMessage(null);
                          }}
                        />
                        <div className="flex gap-2 pt-0.5">
                          <button
                            type="button"
                            className="text-[10px] font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300"
                            onClick={() => {
                              const next = [...actualHours];
                              while (next.length <= idx) next.push(null);
                              next[idx] = week.plannedHours;
                              setActualHours(next);
                              setRebalanceMessage(null);
                            }}
                          >
                            Mark complete
                          </button>
                          {actualHours[idx] != null && (
                            <button
                              type="button"
                              className="text-[10px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                              onClick={() => {
                                const next = [...actualHours];
                                next[idx] = null;
                                setActualHours(next);
                                setRebalanceMessage(null);
                              }}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-md bg-sky-500 px-3 py-1.5 text-xs font-medium text-slate-950 hover:bg-sky-400 sm:w-auto"
                  onClick={() => {
                    if (!baseWeekPlan || !weekPlan || !summary) return;

                    let totalMissed = 0;
                    const lastFilledIndex = actualHours.reduce<number>(
                      (acc, value, idx) => (value != null ? idx : acc),
                      -1
                    );

                    baseWeekPlan.forEach((week, idx) => {
                      const actual = actualHours[idx];
                      if (actual != null && actual < week.plannedHours) {
                        totalMissed += week.plannedHours - actual;
                      }
                    });

                    if (totalMissed <= 0 || lastFilledIndex === -1) {
                      setRebalanceMessage(
                        "No missed hours to rebalance yet. Add actuals to earlier weeks first."
                      );
                      return;
                    }

                    const remainingIndexes = baseWeekPlan
                      .map((_, i) => i)
                      .filter((i) => i > lastFilledIndex);

                    if (remainingIndexes.length === 0) {
                      setRebalanceMessage(
                        "All weeks are in the past. Nothing left to rebalance."
                      );
                      return;
                    }

                    const baseExtra = Math.floor(
                      totalMissed / remainingIndexes.length
                    );
                    const remainder = totalMissed % remainingIndexes.length;
                    const updated = baseWeekPlan.map((week, i) => {
                      const pos = remainingIndexes.indexOf(i);
                      if (pos === -1) {
                        return { ...week, rebalancedExtraHours: 0 };
                      }
                      const extra = baseExtra + (pos < remainder ? 1 : 0);
                      return {
                        ...week,
                        plannedHours: week.plannedHours + extra,
                        rebalancedExtraHours: extra
                      };
                    });

                    setWeekPlan(updated);
                    setSummary(buildSummary(makeSummaryInput(updated, actualHours)));
                    setRebalanceMessage(
                      `You missed ${totalMissed} hour${
                        totalMissed === 1 ? "" : "s"
                      }. StudyForge redistributed them across your remaining weeks.`
                    );
                  }}
                >
                  Rebalance Plan
                </button>

                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-200 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 sm:w-auto"
                  onClick={() => {
                    if (!baseWeekPlan) return;
                    setWeekPlan(baseWeekPlan);
                    setRebalanceMessage(null);
                    setSummary(buildSummary(makeSummaryInput(baseWeekPlan, actualHours)));
                  }}
                >
                  Undo Rebalance
                </button>

                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-200 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 sm:w-auto"
                  onClick={() => {
                    if (!baseWeekPlan) return;
                    const freshActuals = new Array(baseWeekPlan.length).fill(null) as (number | null)[];
                    setWeekPlan(baseWeekPlan);
                    setRebalanceMessage(null);
                    setActualHours(freshActuals);
                    setSummary(buildSummary(makeSummaryInput(baseWeekPlan, freshActuals)));
                  }}
                >
                  Reset All Progress
                </button>

                {rebalanceMessage ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{rebalanceMessage}</p>
                ) : null}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Study plan assumptions: uses a {summary.targetHours}-hour planning
                benchmark for CFA Level {summary.cfaLevel}
                {summary.levelIIIPathway ? (
                  <>
                    {" "}
                    (
                    {
                      LEVEL_III_PATHWAY_LABEL[summary.levelIIIPathway]
                    }{" "}
                    pathway)
                  </>
                ) : null}
                . Topics are sequenced by timeline pressure (heavier topics early,
                review and mocks at the end). Partial first/last weeks are prorated.
              </p>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

