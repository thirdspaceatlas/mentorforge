import { describe, it, expect } from "vitest";
import {
  buildGeneratedStudyPlan,
  generateStudyPlanBodySchema,
} from "@/lib/plan/generateStudyPlan";
import { buildFullWeekPlan, type CfaLevel } from "@/lib/plan/weekPlanBuilder";
import { serializeWeekPlan } from "@/lib/study-plan/serialize";

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Mirrors web onboarding: buildFullWeekPlan + serializeWeekPlan for the same inputs. */
function webOnboardingWeekPlan(input: {
  examLevel: CfaLevel;
  examDate: string;
  weeklyHours: number;
  planStartDate: string;
  weekStartDay: string;
  levelIIIPathway?: "privateWealth" | "privateMarkets" | "portfolioManagement" | null;
}) {
  return serializeWeekPlan(
    buildFullWeekPlan({
      start: parseLocalDate(input.planStartDate),
      examDate: parseLocalDate(input.examDate),
      weekStartDay: input.weekStartDay,
      weeklyHours: input.weeklyHours,
      cfaLevel: input.examLevel,
      levelIIIPathway:
        input.examLevel === "III" ? (input.levelIIIPathway ?? null) : null,
    })
  );
}

describe("buildGeneratedStudyPlan", () => {
  it("maps Level I inputs to the same weekPlan as web onboarding", () => {
    const raw = {
      examLevel: "I" as const,
      examDate: "2026-11-15",
      weeklyHours: 8,
      planStartDate: "2026-01-01",
      weekStartDay: "1" as const,
    };
    const input = generateStudyPlanBodySchema.parse(raw);
    const generated = buildGeneratedStudyPlan(input);
    const expected = webOnboardingWeekPlan(raw);

    expect(generated.weekPlan).toEqual(expected);
    expect(generated.baseWeekPlan).toEqual(expected);
    expect(generated.actualHours).toHaveLength(expected.length);
    expect(generated.actualHours.every((h) => h === null)).toBe(true);
    expect(generated.examLevel).toBe("I");
    expect(generated.levelIIIPathway).toBeNull();
  });

  it("maps Level III pathway inputs to the same weekPlan as web onboarding", () => {
    const raw = {
      examLevel: "III" as const,
      examDate: "2026-08-20",
      weeklyHours: 12,
      planStartDate: "2026-02-01",
      weekStartDay: "0" as const,
      levelIIIPathway: "privateWealth" as const,
      dayStartHour: 8,
      dayEndHour: 21,
      calendarPreferredSessionMin: 60,
    };
    const input = generateStudyPlanBodySchema.parse(raw);
    const generated = buildGeneratedStudyPlan(input);
    const expected = webOnboardingWeekPlan(raw);

    expect(generated.weekPlan).toEqual(expected);
    expect(generated.baseWeekPlan).toEqual(expected);
    expect(generated.levelIIIPathway).toBe("privateWealth");
    expect(generated.dayStartHour).toBe(8);
    expect(generated.dayEndHour).toBe(21);
    expect(generated.calendarPreferredSessionMin).toBe(60);
  });

  it("rejects examDate on or before planStartDate", () => {
    const result = generateStudyPlanBodySchema.safeParse({
      examLevel: "I",
      examDate: "2026-01-01",
      weeklyHours: 8,
      planStartDate: "2026-01-01",
      weekStartDay: "1",
    });
    expect(result.success).toBe(false);
  });
});
