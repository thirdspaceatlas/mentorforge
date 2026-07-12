/**
 * Study-plan week generation — extracted verbatim from app/app/page.tsx so the
 * generation logic lives in one place (FORGE-3: "move inline generation out of
 * page.tsx"). Pure + client-safe. Behavior is unchanged; page.tsx now imports
 * `buildFullWeekPlan` / `deriveBaseWeekPlanFromDisplay` from here.
 */

export type CfaLevel = "I" | "II" | "III";
export type LevelIIIPathway = "privateWealth" | "privateMarkets" | "portfolioManagement";

export type WeekPlan = {
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

export const alignWeekStartOnOrBefore = (d: Date, weekStartDay: string) => {
  const targetDow = Number(weekStartDay);
  const base = new Date(d);
  const currentDow = base.getDay();
  const diff = (currentDow - targetDow + 7) % 7;
  base.setDate(base.getDate() - diff);
  return base;
};

export const formatDateLabel = (d: Date) =>
  d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });

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

export const getPlaceholderTopics = (
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

export const sequenceTopicsForWeeks = (topics: string[], totalWeeks: number): string[] => {
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

export const buildFullWeekPlan = (args: {
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
export const deriveBaseWeekPlanFromDisplay = (plan: WeekPlan[]): WeekPlan[] =>
  plan.map((w) => ({
    ...w,
    plannedHours: Math.max(1, w.plannedHours - (w.rebalancedExtraHours ?? 0)),
    rebalancedExtraHours: 0,
  }));
