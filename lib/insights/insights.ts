import crypto from "node:crypto";

export type Signals = {
  examLevel: string;
  examDate: string;
  daysToExam: number;
  totalWeeks: number;
  completedWeeks: number;
  hoursLogged: number;
  hoursPlanned: number;
  pacePercent: number;
  feasible: boolean;
  currentTopic: string | null;
};

export function signatureOf(s: Signals): string {
  return crypto.createHash("sha1").update(JSON.stringify(s)).digest("hex");
}

export function buildPrompt(s: Signals): string {
  return [
    "You are a calm, reassuring CFA study coach. Using ONLY the data below, write:",
    "1) readiness: a 2-sentence assessment of where the candidate stands (warm, steady, specific with the numbers).",
    "2) coachTip: ONE concrete study action for THIS week (mention the current focus topic if present).",
    'Return STRICT JSON only: { "readiness": string, "coachTip": string }. No markdown.',
    "",
    "DATA:",
    JSON.stringify(s, null, 2),
  ].join("\n");
}

/** Deterministic fallback so Home never breaks if the LLM call fails. */
export function fallback(s: Signals): { readiness: string; coachTip: string } {
  const readiness =
    `You're on week ${s.completedWeeks + 1} of ${s.totalWeeks} with ${s.daysToExam} days ` +
    `until the Level ${s.examLevel} exam. You've logged ${Math.round(s.hoursLogged)} of ` +
    `${Math.round(s.hoursPlanned)} planned hours${
      s.pacePercent >= 90
        ? " — right on rhythm, keep it steady."
        : s.feasible
          ? " — a solid base; a little more this week keeps you on track."
          : " — let's tighten the plan so it stays achievable."
    }`;
  const topic = s.currentTopic ?? "your current topic";
  const coachTip =
    `Block two focused sessions on ${topic} this week and close with 20 practice questions.`;
  return { readiness, coachTip };
}
