import { CFA_L1_TOPICS, type TopicDefinition } from "./syllabusCfaL1";

export type TopicTarget = {
  topicId: string;
  targetHours: number;
};

export type WeeklyTopicAllocation = {
  topicId: string;
  hours: number;
};

export type PlanWeek = {
  weekIndex: number;
  startDate: Date;
  endDate: Date;
  plannedHours: number;
  topicAllocations: WeeklyTopicAllocation[];
};

export type GeneratedPlan = {
  totalWeeks: number;
  totalHours: number;
  topicTargets: TopicTarget[];
  weeks: PlanWeek[];
};

export type WeekConfig = {
  planAnchorDate: Date;
  examDate: Date;
  weekStartDay: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  minWeeks?: number;
};

export function computeWeekBoundaries(config: WeekConfig): PlanWeek[] {
  const { planAnchorDate, examDate, weekStartDay, minWeeks = 4 } = config;
  const start = startOfFirstWeek(planAnchorDate, weekStartDay);

  const weeks: PlanWeek[] = [];
  let currentStart = start;
  let index = 0;

  while (currentStart <= examDate) {
    const end = addDays(currentStart, 6);
    weeks.push({
      weekIndex: index,
      startDate: currentStart,
      endDate: end > examDate ? examDate : end,
      plannedHours: 0,
      topicAllocations: []
    });
    index += 1;
    currentStart = addDays(currentStart, 7);
  }

  while (weeks.length < minWeeks) {
    const last = weeks[weeks.length - 1] ?? {
      weekIndex: -1,
      startDate: start,
      endDate: start
    };
    const nextStart = addDays(last.endDate, 1);
    const nextEnd = addDays(nextStart, 6);
    weeks.push({
      weekIndex: weeks.length,
      startDate: nextStart,
      endDate: nextEnd,
      plannedHours: 0,
      topicAllocations: []
    });
  }

  return weeks;
}

export type GeneratePlanInput = {
  examDate: Date;
  weeklyHours: number;
  planAnchorDate: Date;
  weekStartDay: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  topics?: TopicDefinition[];
};

export function generatePlan(input: GeneratePlanInput): GeneratedPlan {
  const {
    examDate,
    weeklyHours,
    planAnchorDate,
    weekStartDay,
    topics = CFA_L1_TOPICS
  } = input;

  const weeks = computeWeekBoundaries({
    planAnchorDate,
    examDate,
    weekStartDay
  });

  const totalWeeks = weeks.length;
  const totalHours = weeklyHours * totalWeeks;

  const totalRecommended = topics.reduce(
    (sum, t) => sum + t.recommendedHours,
    0
  );

  const rawTargets = topics.map((topic) => {
    const share = topic.recommendedHours / totalRecommended;
    const target = totalHours * share;
    return {
      topicId: topic.id,
      targetHoursFloat: target
    };
  });

  const roundedTargets: TopicTarget[] = rawTargets.map((t) => ({
    topicId: t.topicId,
    targetHours: Math.round(t.targetHoursFloat)
  }));

  const roundedTotal = roundedTargets.reduce(
    (sum, t) => sum + t.targetHours,
    0
  );
  const diff = roundedTotal - totalHours;

  if (diff !== 0 && roundedTargets.length > 0) {
    roundedTargets[roundedTargets.length - 1] = {
      ...roundedTargets[roundedTargets.length - 1],
      targetHours: roundedTargets[roundedTargets.length - 1].targetHours - diff
    };
  }

  const weeksWithAllocations = weeks.map((week) => {
    const topicAllocations: WeeklyTopicAllocation[] = roundedTargets.map(
      (target) => ({
        topicId: target.topicId,
        hours: Math.max(
          0,
          Math.round(target.targetHours / totalWeeks)
        )
      })
    );

    const plannedHours = topicAllocations.reduce(
      (sum, a) => sum + a.hours,
      0
    );

    return {
      ...week,
      plannedHours,
      topicAllocations
    };
  });

  return {
    totalWeeks,
    totalHours,
    topicTargets: roundedTargets,
    weeks: weeksWithAllocations
  };
}

function startOfFirstWeek(
  anchor: Date,
  weekStartDay: 0 | 1 | 2 | 3 | 4 | 5 | 6
): Date {
  const d = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  const day = d.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const diff = (7 + (weekStartDay - day)) % 7;
  return addDays(d, diff);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

