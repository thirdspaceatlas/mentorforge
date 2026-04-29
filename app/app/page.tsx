"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { serializeWeekPlan, deserializeWeekPlan } from "@/lib/study-plan/serialize";
import type { SavedStudyPlanPayload } from "@/lib/study-plan/serialize";
import { useSupabaseUser } from "@/lib/supabase/use-supabase-user";
import { usePlan } from "@/components/app/PlanProvider";
import { hasFeatureForPlan } from "@/lib/access";
import { FeatureGate } from "@/components/app/FeatureGate";
import { CapHitCard } from "@/components/app/CapHitCard";
import { FirstNameBackfillPrompt } from "@/components/app/FirstNameBackfillPrompt";
import { Events, track, bucketWeekCount } from "@/lib/analytics";

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
  levelIIIPathway: LevelIIIPathway | null;
  examWindowLabel: string;
  readinessNote: string;
  suggestedNextWindowLabel: string | null;
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

const alignWeekStartOnOrBefore = (d: Date, weekStartDay: string) => {
  const targetDow = Number(weekStartDay);
  const base = new Date(d);
  const currentDow = base.getDay();
  const diff = (currentDow - targetDow + 7) % 7;
  base.setDate(base.getDate() - diff);
  return base;
};

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

const CFA_LEVEL_BENCHMARK: Record<CfaLevel, number> = {
  I: 300,
  II: 325,
  III: 350
};

type ExamWindow = {
  id: string;
  label: string;
  startISO: string;
};

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

const getStudyTacticsBullets = (
  cfaLevel: CfaLevel,
  levelIIIPathway: LevelIIIPathway | null
): string[] => {
  switch (cfaLevel) {
    case "I":
      return [
        "Mix new readings with practice items and spaced review so topics stick\u2014don't only re-watch lectures.",
        "Level I rewards breadth: balance across topic areas and drill ethics and end-of-reading practice questions.",
        "Track weak LOS areas and revisit them on a short cycle (e.g. weekly mini-reviews).",
        "Reserve your final review week for timed practice, mocks, and high-yield gaps\u2014not new material."
      ];
    case "II":
      return [
        "Mix new readings with practice items and spaced review\u2014then validate with item sets, not only recall.",
        "Level II is vignette-heavy: practice reading long passages and answering linked questions under time.",
        "Track weak LOS areas and revisit them on a short cycle (e.g. weekly mini-reviews).",
        "Reserve your final review week for timed item-set blocks and weak-topic drills\u2014not first passes at new material."
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
        "Reserve your final review week for timed practice, mocks, and high-yield gaps\u2014not new material."
      ];
    }
  }
};

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

const placeNearest = (slots: (string | null)[], target: number, value: string): boolean => {
  for (let d = 0; d < slots.length; d++) {
    if (target + d < slots.length && slots[target + d] === null) { slots[target + d] = value; return true; }
    if (target - d >= 0 && slots[target - d] === null) { slots[target - d] = value; return true; }
  }
  return false;
};

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

  slots[totalWeeks - 1] = "Final Review & Mocks";
  if (totalWeeks >= 8) slots[totalWeeks - 2] = "Review & Practice";

  if (totalWeeks >= 10) {
    for (
      let r = REVIEW_CADENCE;
      r < totalWeeks - 2;
      r += REVIEW_CADENCE + 1
    ) {
      if (slots[r] === null) slots[r] = "Review & Weak Areas";
    }
  }

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

  const sortedCore = [...coreTopics]
    .map((t, i) => ({ name: t, origIdx: i }))
    .sort((a, b) => {
      const diff = (TOPIC_EXAM_WEIGHT[b.name] ?? 5) - (TOPIC_EXAM_WEIGHT[a.name] ?? 5);
      return diff !== 0 ? diff : a.origIdx - b.origIdx;
    })
    .map((t) => t.name);

  const heavyTopics = sortedCore.filter(
    (t) => (TOPIC_EXAM_WEIGHT[t] ?? 5) >= RECURRENCE_WEIGHT_THRESHOLD
  );

  const topicQueue = [...sortedCore];
  if (totalWeeks >= 12 && heavyTopics.length > 0) {
    topicQueue.push(...heavyTopics.map((t) => `${t} (deep dive)`));
  }

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

/**
 * Recover the pre-rebalance baseline when `baseWeekPlan` was never saved or is empty.
 * Rebalance math must use baseline planned hours, not post-rebalance totals.
 */
const deriveBaseWeekPlanFromDisplay = (plan: WeekPlan[]): WeekPlan[] =>
  plan.map((w) => ({
    ...w,
    plannedHours: Math.max(1, w.plannedHours - (w.rebalancedExtraHours ?? 0)),
    rebalancedExtraHours: 0,
  }));

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

type StudyPlanAnchorMode = "progress" | "calendar";

const getCalendarWeekIndex = (plan: WeekPlan[]): number => {
  if (plan.length === 0) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inside = plan.findIndex(
    (w) => w.startDate <= today && today <= w.endDate
  );
  if (inside !== -1) return inside;
  const firstFuture = plan.findIndex((w) => w.startDate > today);
  if (firstFuture !== -1) return firstFuture;
  return plan.length - 1;
};

const getProgressWeekIndex = (
  plan: WeekPlan[],
  actuals: (number | null)[]
): number => {
  if (plan.length === 0) return 0;
  const incomplete = plan.findIndex((w, i) => {
    const a = actuals[i] ?? null;
    return getWeekStatus(a, w.plannedHours) !== "complete";
  });
  if (incomplete !== -1) return incomplete;
  return plan.length - 1;
};

const getVisibleWeekSliceStart = (
  planLength: number,
  windowSize: number,
  focusIdx: number
): number => {
  if (planLength <= windowSize) return 0;
  if (focusIdx + windowSize <= planLength) return focusIdx;
  return Math.max(0, planLength - windowSize);
};

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

function PlannerInner() {
  const { user } = useSupabaseUser();
  const [planLoaded, setPlanLoaded] = useState(false);
  const skipNextSave = useRef(false);

  const [examDate, setExamDate] = useState(() =>
    getDefaultExamDateForLevel("I")
  );
  const [weeklyHours, setWeeklyHours] = useState<number | "">(8);
  const weeklyHoursNum = weeklyHours === "" ? 0 : weeklyHours;
  const [planStartDate, setPlanStartDate] = useState(() => todayISO());
  const [weekStartDay, setWeekStartDay] = useState("1");
  const [formError, setFormError] = useState<string | null>(null);
  const [planBuilderOpen, setPlanBuilderOpen] = useState(true);
  const [summary, setSummary] = useState<PlanSummary | null>(null);
  const [baseWeekPlan, setBaseWeekPlan] = useState<WeekPlan[] | null>(null);
  const [weekPlan, setWeekPlan] = useState<WeekPlan[] | null>(null);
  const [actualHours, setActualHours] = useState<(number | null)[]>([]);
  const [rebalanceMessage, setRebalanceMessage] = useState<string | null>(null);
  const [rebalanceCap, setRebalanceCap] = useState<
    { used: number; cap: number; resetsAt?: string } | null
  >(null);
  const [calendarCap, setCalendarCap] = useState<
    { used: number; cap: number } | null
  >(null);

  // Phase 1b: surface the ?cap=calendar redirect from the OAuth callback.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("cap") !== "calendar") return;
    const used = Number(params.get("used")) || 1;
    const cap = Number(params.get("limit")) || 1;
    setCalendarCap({ used, cap });
    params.delete("cap");
    params.delete("used");
    params.delete("limit");
    const qs = params.toString();
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`
    );
  }, []);
  const [examLevel, setExamLevel] = useState<CfaLevel>("I");
  const [levelIIIPathway, setLevelIIIPathway] =
    useState<LevelIIIPathway>("portfolioManagement");
  const [showAllWeeks, setShowAllWeeks] = useState(false);
  const [studyPlanAnchor, setStudyPlanAnchor] =
    useState<StudyPlanAnchorMode>("progress");
  const [calendarPreferredSessionMin, setCalendarPreferredSessionMin] =
    useState(45);

  const examWindows = useMemo(() => getExamWindowsSorted(examLevel), [examLevel]);

  const examMetadata = useMemo(() => {
    const selectedWindow = examWindows.find((w) => w.startISO === examDate);
    const nextWin = getNextExamWindow(examLevel, examDate);
    return {
      examWindowLabel: selectedWindow?.label ?? "Selected exam window",
      suggestedNextWindowLabel: nextWin?.label ?? null,
      finalReviewWeekLabel: getFinalReviewWeekLabel(examDate, weekStartDay)
    };
  }, [examWindows, examLevel, examDate, weekStartDay]);

  // ─── Load saved plan on mount ───
  useEffect(() => {
    if (!user) return;
    fetch("/api/study-plan")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.plan) return;
        const p = data.plan as SavedStudyPlanPayload;
        skipNextSave.current = true;
        setExamLevel(p.examLevel as CfaLevel);
        setExamDate(p.examDate);
        setWeeklyHours(p.weeklyHours);
        setPlanStartDate(p.planStartDate);
        setWeekStartDay(p.weekStartDay);
        if (p.levelIIIPathway) setLevelIIIPathway(p.levelIIIPathway as LevelIIIPathway);
        if (typeof p.calendarPreferredSessionMin === "number") {
          setCalendarPreferredSessionMin(
            Math.min(180, Math.max(5, Math.round(p.calendarPreferredSessionMin)))
          );
        }

        // If weekPlan has data, restore the full plan; otherwise just pre-fill the form
        if (p.weekPlan.length > 0) {
          const deserialized = deserializeWeekPlan(p.weekPlan);
          const rawBase = Array.isArray(p.baseWeekPlan) ? p.baseWeekPlan : [];
          let deserializedBase = deserializeWeekPlan(rawBase);
          if (deserializedBase.length === 0 && deserialized.length > 0) {
            deserializedBase = deriveBaseWeekPlanFromDisplay(deserialized);
          }
          setWeekPlan(deserialized);
          setBaseWeekPlan(deserializedBase);
          setActualHours(p.actualHours);
          setPlanBuilderOpen(false);
        }
        // else: preferences only (from onboarding) — form stays open with pre-filled values
      })
      .catch(() => {})
      .finally(() => setPlanLoaded(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Recompute summary whenever weekPlan or actualHours change (including after load)
  useEffect(() => {
    if (!weekPlan || !planLoaded) return;
    // Defer to next tick so examMetadata is fresh
    const id = requestAnimationFrame(() => {
      setSummary(buildSummary({
        plan: weekPlan,
        actuals: actualHours,
        weeklyHoursAvail: weeklyHoursNum,
        targetHours: CFA_LEVEL_BENCHMARK[examLevel],
        cfaLevel: examLevel,
        levelIIIPathway: examLevel === "III" ? levelIIIPathway : null,
        examWindowLabel: examMetadata.examWindowLabel,
        suggestedNextWindowLabel: examMetadata.suggestedNextWindowLabel,
        finalReviewWeekLabel: examMetadata.finalReviewWeekLabel,
      }));
    });
    return () => cancelAnimationFrame(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekPlan, actualHours, planLoaded]);

  // ─── Auto-save (debounced) ───
  const buildPayload = useCallback((): SavedStudyPlanPayload | null => {
    if (!weekPlan || !baseWeekPlan) return null;
    return {
      examLevel,
      examDate,
      weeklyHours: weeklyHoursNum,
      planStartDate,
      weekStartDay,
      levelIIIPathway: examLevel === "III" ? levelIIIPathway : null,
      calendarPreferredSessionMin,
      weekPlan: serializeWeekPlan(weekPlan),
      baseWeekPlan: serializeWeekPlan(baseWeekPlan),
      actualHours,
    };
  }, [weekPlan, baseWeekPlan, actualHours, examLevel, examDate, weeklyHoursNum, planStartDate, weekStartDay, levelIIIPathway, calendarPreferredSessionMin]);

  useEffect(() => {
    if (!user || !weekPlan || !planLoaded) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    const payload = buildPayload();
    if (!payload) return;
    const timer = setTimeout(() => {
      fetch("/api/study-plan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }, 1000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekPlan, baseWeekPlan, actualHours, examLevel, examDate, weeklyHoursNum, planStartDate, weekStartDay, levelIIIPathway, calendarPreferredSessionMin, planLoaded]);

  const makeSummaryInput = (plan: WeekPlan[], actuals: (number | null)[]): BuildSummaryInput => ({
    plan,
    actuals,
    weeklyHoursAvail: weeklyHoursNum,
    targetHours: CFA_LEVEL_BENCHMARK[examLevel],
    cfaLevel: examLevel,
    levelIIIPathway: examLevel === "III" ? levelIIIPathway : null,
    ...examMetadata
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

    setSummary(buildSummary(makeSummaryInput(newWeekPlan, freshActuals)));

    setBaseWeekPlan(newWeekPlan);
    setWeekPlan(newWeekPlan);
    setActualHours(freshActuals);

    setPlanBuilderOpen(false);

    track(Events.planGenerated, {
      level: examLevel,
      week_count_bucket: bucketWeekCount(newWeekPlan.length),
      is_first_generation: "true",
    });
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

  const studyPlanFocusIndex = useMemo(() => {
    if (!weekPlan?.length) return 0;
    return studyPlanAnchor === "calendar"
      ? getCalendarWeekIndex(weekPlan)
      : getProgressWeekIndex(weekPlan, actualHours);
  }, [weekPlan, actualHours, studyPlanAnchor]);

  const { visibleWeekPlan, sliceStart } = useMemo(() => {
    if (!weekPlan?.length) {
      return { visibleWeekPlan: [] as WeekPlan[], sliceStart: 0 };
    }
    if (showAllWeeks || weekPlan.length <= VISIBLE_WEEKS_DEFAULT) {
      return { visibleWeekPlan: weekPlan, sliceStart: 0 };
    }
    const start = getVisibleWeekSliceStart(
      weekPlan.length,
      VISIBLE_WEEKS_DEFAULT,
      studyPlanFocusIndex
    );
    return {
      visibleWeekPlan: weekPlan.slice(start, start + VISIBLE_WEEKS_DEFAULT),
      sliceStart: start
    };
  }, [weekPlan, showAllWeeks, studyPlanFocusIndex]);

  const plan = usePlan();
  const levelGateLocked =
    (examLevel === "II" && !hasFeatureForPlan(plan, "level_II")) ||
    (examLevel === "III" && !hasFeatureForPlan(plan, "level_III"));

  if (!planLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full space-y-8">
      <FirstNameBackfillPrompt />

      {calendarCap ? (
        <CapHitCard
          capType="calendar"
          used={calendarCap.used}
          cap={calendarCap.cap}
          onDismiss={() => setCalendarCap(null)}
        />
      ) : null}

      <section className="flex items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-amber-mf">
            <span aria-hidden className="inline-block h-px w-4 bg-amber-mf" />
            Plan
          </p>
          <h1 className="mt-2 font-display text-[clamp(1.5rem,4.5vw,2rem)] font-medium leading-tight tracking-tight text-ink dark:text-slate-50 sm:text-[2rem]">
            Your study plan.
          </h1>
        </div>
        {weekPlan && !planBuilderOpen && (
          <button
            type="button"
            onClick={() => setPlanBuilderOpen(true)}
            className="inline-flex min-h-[2.5rem] items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
              <path d="M10.5 1.75l1.75 1.75L4.5 11.25H2.75V9.5z" />
            </svg>
            Edit plan settings
          </button>
        )}
      </section>

      {weekPlan && !planBuilderOpen ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-slate-200/90 bg-white/90 px-5 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
          <span>Level <strong className="text-slate-900 dark:text-slate-100">{examLevel}</strong></span>
          <span className="text-slate-300 dark:text-slate-600">&middot;</span>
          <span><strong className="text-slate-900 dark:text-slate-100">{summary?.examWindowLabel}</strong></span>
          <span className="text-slate-300 dark:text-slate-600">&middot;</span>
          <span><strong className="text-slate-900 dark:text-slate-100">{weeklyHoursNum}</strong> hrs/wk</span>
          <span className="text-slate-300 dark:text-slate-600">&middot;</span>
          <span><strong className="text-slate-900 dark:text-slate-100">{weekPlan.length}</strong> weeks</span>
        </div>
      ) : (
      <form
        onSubmit={handleSubmit}
        className="min-w-0 space-y-4 rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none sm:p-6"
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
                  "min-h-[2.75rem] flex-1 touch-manipulation rounded px-3 py-2 text-sm font-medium transition-colors [-webkit-tap-highlight-color:transparent] " +
                  (examLevel === level
                    ? "bg-emerald-700 text-white dark:bg-emerald-500 dark:text-emerald-950"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/80")
                }
              >
                Level {level}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Switch levels to match your exam. Benchmarks and weekly topic focus update
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
                    "min-h-[2.75rem] touch-manipulation rounded px-3 py-2 text-left text-sm font-medium transition-colors [-webkit-tap-highlight-color:transparent] sm:flex-1 sm:text-center " +
                    (levelIIIPathway === key
                      ? "bg-emerald-700 text-white dark:bg-emerald-500 dark:text-emerald-950"
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
              className="min-h-[2.75rem] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:text-sm"
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
              className="w-full rounded-md border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:text-slate-100"
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
              className="min-h-[2.75rem] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:text-sm"
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
              className="min-h-[2.75rem] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:text-sm"
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
          className="inline-flex min-h-[2.75rem] touch-manipulation items-center justify-center rounded-md bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-800 [-webkit-tap-highlight-color:transparent] dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400"
        >
          Build my plan
        </button>
      </form>
      )}

      {summary ? (
        <section className="rounded-2xl border border-hair bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-7">
          <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-amber-mf">
            <span aria-hidden className="inline-block h-px w-4 bg-amber-mf" />
            Summary
          </p>
          <h2 className="mt-2 font-display text-2xl font-medium leading-tight tracking-tight text-ink dark:text-slate-100 sm:text-[26px]">
            Plan summary.
          </h2>

          <FeatureGate locked={levelGateLocked}>
            <FeatureGate locked={false}>
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
                for mocks, weak-area drills, and light review&mdash;not new material.
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
            </FeatureGate>

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
              <FeatureGate locked={false}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-amber-mf">
                    <span aria-hidden className="inline-block h-px w-4 bg-amber-mf" />
                    Weeks
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-medium leading-tight tracking-tight text-ink dark:text-slate-100 sm:text-[26px]">
                    {showAllWeeks || weekPlan.length <= VISIBLE_WEEKS_DEFAULT
                      ? `${weekPlan.length} week${weekPlan.length === 1 ? "" : "s"}.`
                      : `Weeks ${weekPlan[sliceStart]!.week}\u2013${
                          weekPlan[sliceStart + visibleWeekPlan.length - 1]!.week
                        } of ${weekPlan.length}.`}
                  </h3>
                  <p className="mt-1 text-[12.5px] text-slate-600 dark:text-slate-400">
                    Window follows{" "}
                    {studyPlanAnchor === "progress"
                      ? "your progress (first incomplete week)."
                      : "this week (week containing today)."}
                  </p>
                </div>
                <div className="flex flex-shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                  <div
                    role="group"
                    aria-label="Study plan window focus"
                    className="inline-flex rounded-md border border-slate-300 bg-slate-50 p-0.5 dark:border-slate-600 dark:bg-slate-900/80"
                  >
                    <button
                      type="button"
                      onClick={() => setStudyPlanAnchor("progress")}
                      aria-pressed={studyPlanAnchor === "progress"}
                      className={
                        "min-h-[2.5rem] min-w-[5.5rem] touch-manipulation rounded px-3 py-2 text-xs font-medium transition-colors [-webkit-tap-highlight-color:transparent] " +
                        (studyPlanAnchor === "progress"
                          ? "bg-emerald-700 text-white dark:bg-emerald-500 dark:text-emerald-950"
                          : "text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800")
                      }
                    >
                      Progress
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudyPlanAnchor("calendar")}
                      aria-pressed={studyPlanAnchor === "calendar"}
                      className={
                        "min-h-[2.5rem] min-w-[5.5rem] touch-manipulation rounded px-3 py-2 text-xs font-medium transition-colors [-webkit-tap-highlight-color:transparent] " +
                        (studyPlanAnchor === "calendar"
                          ? "bg-emerald-700 text-white dark:bg-emerald-500 dark:text-emerald-950"
                          : "text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800")
                      }
                    >
                      This Week
                    </button>
                  </div>
                  {weekPlan.length > VISIBLE_WEEKS_DEFAULT && (
                    <button
                      type="button"
                      onClick={() => setShowAllWeeks(!showAllWeeks)}
                      className="text-xs font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
                    >
                      {showAllWeeks ? "Show less" : `View all ${weekPlan.length} weeks`}
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Plan starts {weekPlan[0].startDateLabel}
                {weekPlan[0].daysInWeek < 7
                  ? ` (${weekPlan[0].daysInWeek}-day partial first week)`
                  : ""}
                . Week blocks align to {WEEKDAY_LABELS[Number(weekStartDay)]}.
              </p>

              <div className="grid gap-3 md:grid-cols-2">
                {visibleWeekPlan.map((week) => {
                  const idx = week.week - 1;
                  const wStatus = getWeekStatus(actualHours[idx] ?? null, week.plannedHours);
                  const pill = weekStatusPill(wStatus);
                  const isFocusWeek = idx === studyPlanFocusIndex;
                  return (
                    <div
                      key={week.week}
                      className={
                        "rounded-lg border border-hair bg-white p-3 dark:border-slate-700 dark:bg-slate-900 " +
                        (isFocusWeek
                          ? "ring-2 ring-emerald-500/45 ring-offset-2 ring-offset-paper dark:ring-offset-slate-950"
                          : "")
                      }
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-ink dark:text-slate-100">
                            Week <span className="font-mono tabular-nums">{week.week}</span>
                          </span>
                          {isFocusWeek ? (
                            <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800 dark:text-emerald-300">
                              {studyPlanAnchor === "calendar" ? "This week" : "Focus"}
                            </span>
                          ) : null}
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
                        <div className="shrink-0 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                          {week.startDateLabel} – {week.endDateLabel}
                        </div>
                      </div>
                      <FeatureGate locked={false}>
                        <div className="mt-1 text-sm text-slate-800 dark:text-slate-200">
                          {week.topic}
                        </div>
                      </FeatureGate>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {week.plannedHours} planned hour{week.plannedHours === 1 ? "" : "s"}
                      </div>
                      {week.rebalancedExtraHours > 0 ? (
                        <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                          +{week.rebalancedExtraHours} rebalanced hour
                          {week.rebalancedExtraHours === 1 ? "" : "s"}
                        </div>
                      ) : null}
                      <FeatureGate locked={false}>
                      <div className="mt-2 space-y-1">
                        <label className="text-xs text-slate-500 dark:text-slate-400">
                          Actual hours completed
                        </label>
                        <input
                          type="number"
                          min={0}
                          className="w-full rounded-md border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 px-2 py-1 text-xs text-slate-900 outline-none focus:border-emerald-500 dark:text-slate-100"
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
                            className="text-[10px] font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
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
                      </FeatureGate>
                    </div>
                  );
                })}
              </div>
              </FeatureGate>

              <FeatureGate locked={false}>
              <div className="flex flex-col gap-2 pt-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-800 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400 sm:w-auto"
                  onClick={async () => {
                    if (!weekPlan || !summary) {
                      setRebalanceMessage(
                        "Planner is still loading. Wait a moment and try again."
                      );
                      return;
                    }

                    // Phase 1b cap gate — free plan = 1 rebalance / 7 days.
                    setRebalanceCap(null);
                    try {
                      const capRes = await fetch("/api/study-plan/rebalance", {
                        method: "POST"
                      });
                      if (capRes.status === 402) {
                        const data = await capRes.json();
                        setRebalanceCap({
                          used: data.used,
                          cap: data.cap,
                          resetsAt: data.resetsAt
                        });
                        setRebalanceMessage(null);
                        return;
                      }
                      if (!capRes.ok) {
                        setRebalanceMessage(
                          "Could not start rebalance. Try again in a moment."
                        );
                        return;
                      }
                    } catch {
                      setRebalanceMessage(
                        "Could not reach server. Check your connection and try again."
                      );
                      return;
                    }

                    const base: WeekPlan[] =
                      baseWeekPlan != null && baseWeekPlan.length > 0
                        ? baseWeekPlan
                        : deriveBaseWeekPlanFromDisplay(weekPlan);

                    if (base.length === 0) {
                      setRebalanceMessage(
                        "No plan weeks found. Rebuild your plan and try again."
                      );
                      return;
                    }

                    let totalMissed = 0;
                    for (let idx = 0; idx < base.length; idx++) {
                      const actual = actualHours[idx];
                      const planned = base[idx]!.plannedHours;
                      if (actual != null && actual < planned) {
                        totalMissed += planned - actual;
                      }
                    }

                    let lastFilledIndex = -1;
                    for (let idx = 0; idx < base.length; idx++) {
                      if (actualHours[idx] != null) lastFilledIndex = idx;
                    }

                    if (totalMissed <= 0 || lastFilledIndex === -1) {
                      setRebalanceMessage(
                        "No missed hours to rebalance yet. Enter actual hours where you fell short (earlier weeks first helps)."
                      );
                      return;
                    }

                    const remainingIndexes: number[] = [];
                    for (let i = lastFilledIndex + 1; i < base.length; i++) {
                      remainingIndexes.push(i);
                    }

                    if (remainingIndexes.length === 0) {
                      setRebalanceMessage(
                        base.length === 1
                          ? "This plan only has one study week, so missed hours cannot roll forward. Try a longer study window or higher weekly hours."
                          : "No study weeks left after the last week you logged. Log actuals in order through the week you missed, or extend your exam runway so there is room to absorb extra hours."
                      );
                      return;
                    }

                    const baseExtra = Math.floor(
                      totalMissed / remainingIndexes.length
                    );
                    const remainder = totalMissed % remainingIndexes.length;
                    const updated = base.map((week, i) => {
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

                    if (
                      baseWeekPlan == null ||
                      baseWeekPlan.length === 0
                    ) {
                      setBaseWeekPlan(base);
                    }

                    setWeekPlan(updated);
                    setSummary(buildSummary(makeSummaryInput(updated, actualHours)));
                    setRebalanceMessage(
                      `You missed ${totalMissed} hour${
                        totalMissed === 1 ? "" : "s"
                      }. Those hours were spread across your remaining study weeks.`
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
              </div>
                {rebalanceMessage ? (
                  <p
                    className="text-xs text-slate-600 dark:text-slate-300"
                    role="status"
                    aria-live="polite"
                  >
                    {rebalanceMessage}
                  </p>
                ) : null}
                {rebalanceCap ? (
                  <CapHitCard
                    capType="rebalance"
                    used={rebalanceCap.used}
                    cap={rebalanceCap.cap}
                    resetsAt={rebalanceCap.resetsAt}
                    onDismiss={() => setRebalanceCap(null)}
                  />
                ) : null}
              </div>
              </FeatureGate>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Planner uses a {summary.targetHours}-hour CFA study benchmark for Level{" "}
                {summary.cfaLevel}
                {summary.levelIIIPathway ? (
                  <>
                    {" "}
                    ({LEVEL_III_PATHWAY_LABEL[summary.levelIIIPathway]} pathway)
                  </>
                ) : null}
                . Weekly topics follow timeline pressure (core topics earlier, review
                and mocks toward the end). Partial first and last weeks are prorated to
                your dates.
              </p>
            </div>
          ) : null}
          </FeatureGate>
        </section>
      ) : null}
    </div>
  );
}

export default function PlannerPage() {
  const { user, loading } = useSupabaseUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    redirect("/login");
  }

  return <PlannerInner />;
}
