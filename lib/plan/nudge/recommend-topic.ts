import { CFA_L1_TOPICS, type TopicDefinition } from "@/lib/plan/syllabusCfaL1";

/**
 * Topic recommender (Phase 3) — the missing piece that makes the reliable-nudge
 * rule actually reliable. StudyWindow.topicName/studyType are documented as
 * "set by the topic recommender"; this is that recommender.
 *
 * Approach: walk the CFA syllabus in exam-weight order and map the fraction of
 * the study timeline that has elapsed onto the cumulative recommended-hours
 * curve. Whichever topic the elapsed fraction lands inside is the one the
 * candidate should be studying now. Pure + timezone-agnostic (date-only math),
 * so it stays unit-testable without Prisma or a clock.
 */

export type StudyType = "new" | "review" | "practice";
export type TopicRecommendation = { topicName: string; studyType: StudyType };

function utcDateOnly(iso: string): number {
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  return Date.UTC(y || 1970, (m ?? 1) - 1, d ?? 1);
}

/**
 * Recommend the topic the candidate should focus on right now.
 * Returns null when we can't reliably say (missing/invalid plan dates or empty
 * syllabus) — the caller then declines to send a micro-dose nudge.
 */
export function recommendTopic(opts: {
  planStartDate: string; // ISO date
  examDate: string; // ISO date
  now: Date;
  topics?: TopicDefinition[];
}): TopicRecommendation | null {
  const topics = opts.topics ?? CFA_L1_TOPICS;
  if (topics.length === 0) return null;

  const start = utcDateOnly(opts.planStartDate);
  const exam = utcDateOnly(opts.examDate);
  const now = opts.now.getTime();
  if (!Number.isFinite(start) || !Number.isFinite(exam) || exam <= start) return null;

  // Fraction of the study timeline elapsed, clamped to [0, ~1).
  const frac = Math.min(0.9999, Math.max(0, (now - start) / (exam - start)));

  const totalHours = topics.reduce((s, t) => s + t.recommendedHours, 0);
  if (totalHours <= 0) return null;

  const target = frac * totalHours;
  let cum = 0;
  let current: TopicDefinition = topics[topics.length - 1];
  for (const t of topics) {
    cum += t.recommendedHours;
    if (target < cum) {
      current = t;
      break;
    }
  }

  // studyType heuristic based on where we are in the timeline:
  //   final stretch (<= 21 days to exam) => review
  //   first ~60% of the plan            => new (first pass through material)
  //   otherwise                          => practice (drilling questions)
  const daysUntilExam = (exam - now) / 86_400_000;
  let studyType: StudyType;
  if (daysUntilExam <= 21) studyType = "review";
  else if (frac < 0.6) studyType = "new";
  else studyType = "practice";

  return { topicName: current.name, studyType };
}
