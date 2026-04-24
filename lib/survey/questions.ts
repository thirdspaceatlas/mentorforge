/**
 * Rotating in-digest survey questions.
 *
 * Design doc Phase 1b: "Weekly digest includes a 1-question survey (rotating)."
 * The question each user sees is deterministic from weeks-since-signup, so users
 * get a fresh prompt but the same question if the digest is re-sent the same week.
 */

export type SurveyQuestion = {
  /** Stable identifier persisted on UserSurveyResponse.question. */
  id: string;
  /** Prompt shown in the email. */
  prompt: string;
  /** One-click options. Each option's key is what gets recorded as the answer. */
  options: { key: string; label: string }[];
};

export const QUESTION_BANK: SurveyQuestion[] = [
  {
    id: "week2_blocker",
    prompt: "What's your biggest study blocker this week?",
    options: [
      { key: "time", label: "I can't find time" },
      { key: "focus", label: "I lose focus when I start" },
      { key: "pace", label: "I don't know if I'm on pace" },
      { key: "materials", label: "I can't find the right materials" },
      { key: "other", label: "Something else" }
    ]
  },
  {
    id: "week4_miss",
    prompt: "If MentorForge disappeared tomorrow, what would you miss most?",
    options: [
      { key: "calendar_coach", label: "Calendar Coach scheduling" },
      { key: "week_plan", label: "The week-by-week plan" },
      { key: "rebalance", label: "Smart rebalancing" },
      { key: "progress", label: "Progress tracking" },
      { key: "nothing", label: "Honestly, nothing" }
    ]
  },
  {
    id: "nps_v1",
    prompt: "On a scale of 0-10, how likely are you to recommend MentorForge?",
    options: Array.from({ length: 11 }, (_, i) => ({
      key: String(i),
      label: String(i)
    }))
  }
];

/** Pick the question for `user` based on weeks-since-signup (1-indexed). */
export function pickQuestionForUser(
  profileCreatedAt: Date,
  now: Date = new Date()
): SurveyQuestion {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksSinceSignup = Math.max(
    0,
    Math.floor((now.getTime() - profileCreatedAt.getTime()) / msPerWeek)
  );
  // 0 → week2_blocker, 1 → week4_miss, 2 → nps_v1, then rotate.
  const question = QUESTION_BANK[weeksSinceSignup % QUESTION_BANK.length];
  if (!question) {
    // Unreachable — kept so TS understands the invariant for callers.
    throw new Error("QUESTION_BANK is empty");
  }
  return question;
}
