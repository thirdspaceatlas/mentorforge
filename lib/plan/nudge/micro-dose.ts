/**
 * Micro-dose suggestions + the RELIABLE-NUDGE rule (Phase 3).
 *
 * Locked decision: a micro-study nudge only fires when a suggestion can be
 * RELIABLY generated. When one exists, the push offers the user a choice — use
 * their own materials, or take the suggested micro-dose. Suggestions reference
 * topic/exam-weight metadata we already track (topicName/studyType on the study
 * window), never full learning content. Pure + unit-testable.
 */

export const MIN_MICRO_DOSE_MIN = 10;
export const MAX_MICRO_DOSE_MIN = 45;

export type MicroDose = { topicName: string; activity: string; minutes: number };

export type NudgeInputs = {
  gapMinutes: number;
  topicName?: string | null;
  studyType?: string | null;
};

export type NudgeDecision =
  | { shouldNudge: false; reason: "gap-too-short" | "no-reliable-suggestion" }
  | { shouldNudge: true; microDose: MicroDose };

function activityFor(studyType?: string | null): string {
  switch (studyType) {
    case "review":
      return "Review";
    case "practice":
      return "Practice questions on";
    case "new":
      return "Preview";
    default:
      return "Study";
  }
}

/**
 * A micro-dose can be RELIABLY generated only when we have a concrete topic and a
 * workable gap. Otherwise return null → no micro nudge (per the reliable rule).
 */
export function buildMicroDose(inputs: NudgeInputs): MicroDose | null {
  const topic = inputs.topicName?.trim();
  if (!topic) return null;
  if (inputs.gapMinutes < MIN_MICRO_DOSE_MIN) return null;
  const minutes = Math.min(MAX_MICRO_DOSE_MIN, Math.floor(inputs.gapMinutes));
  return { topicName: topic, activity: activityFor(inputs.studyType), minutes };
}

export function decideNudge(inputs: NudgeInputs): NudgeDecision {
  const dose = buildMicroDose(inputs);
  if (!dose) {
    return {
      shouldNudge: false,
      reason: inputs.gapMinutes < MIN_MICRO_DOSE_MIN ? "gap-too-short" : "no-reliable-suggestion",
    };
  }
  return { shouldNudge: true, microDose: dose };
}

export type NudgePayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
  actions: { action: "micro-dose" | "open-materials"; title: string }[];
};

/**
 * Build the push payload for a "Study Now" nudge. Returns null when no reliable
 * suggestion exists (so the caller skips the nudge). Offers BOTH choices: take
 * the micro-dose, or open your own materials.
 */
export function buildNudgePayload(opts: {
  windowId: string;
  minutesUntil: number;
  gapMinutes: number;
  topicName?: string | null;
  studyType?: string | null;
  url?: string;
}): NudgePayload | null {
  const decision = decideNudge({
    gapMinutes: opts.gapMinutes,
    topicName: opts.topicName,
    studyType: opts.studyType,
  });
  if (!decision.shouldNudge) return null;

  const dose = decision.microDose;
  const durationLabel = `${opts.gapMinutes} min`;
  const title =
    opts.minutesUntil <= 5
      ? `${durationLabel} window open now`
      : `${durationLabel} window in ${opts.minutesUntil} min`;
  const body = `${dose.activity} ${dose.topicName} — or open your own materials.`;

  return {
    title,
    body,
    url: opts.url ?? "/app/today",
    tag: `window-${opts.windowId}`,
    actions: [
      { action: "micro-dose", title: `${dose.minutes}-min: ${dose.topicName}` },
      { action: "open-materials", title: "Open my materials" },
    ],
  };
}
