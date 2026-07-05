import type { Guardrails } from "./types";

/**
 * Default protective rails (spec §4). User-adjustable.
 *
 * These numbers are STARTING POINTS to validate in Interview 04 (FORGE-1, spec §10:
 * "what numbers feel protective vs. patronizing?"). Do not treat as final.
 */
export const DEFAULT_GUARDRAILS: Guardrails = {
  maxDailyMinutes: 300, // 5h hard ceiling on any single day
  maxWeeklyHours: 20,
  minSessionMinutes: 25, // sub-25-min blocks aren't worth scheduling
  minWindowMinutes: 120, // 2h minimum window width (FORGE-3 decision, 2026-05-23)
};
