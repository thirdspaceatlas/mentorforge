import { z } from "zod";
import { buildFullWeekPlan, type CfaLevel, type LevelIIIPathway } from "@/lib/plan/weekPlanBuilder";
import { serializeWeekPlan, type SavedStudyPlanPayload } from "@/lib/study-plan/serialize";

const weekStartDaySchema = z.enum(["0", "1", "2", "3", "4", "5", "6"]);
const levelIIIPathwaySchema = z.enum([
  "privateWealth",
  "privateMarkets",
  "portfolioManagement",
]);

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export const generateStudyPlanBodySchema = z
  .object({
    examLevel: z.enum(["I", "II", "III"]),
    examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "examDate must be YYYY-MM-DD"),
    weeklyHours: z.number().positive().finite(),
    planStartDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "planStartDate must be YYYY-MM-DD"),
    weekStartDay: weekStartDaySchema.optional().default("1"),
    levelIIIPathway: levelIIIPathwaySchema.optional(),
    dayStartHour: z.number().int().min(0).max(23).optional(),
    dayEndHour: z.number().int().min(1).max(24).optional(),
    calendarPreferredSessionMin: z.number().int().min(5).max(180).optional(),
  })
  .superRefine((data, ctx) => {
    const start = parseLocalDate(data.planStartDate);
    const exam = parseLocalDate(data.examDate);
    if (!(exam.getTime() > start.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "examDate must be after planStartDate",
        path: ["examDate"],
      });
    }
    if (
      data.dayStartHour != null &&
      data.dayEndHour != null &&
      data.dayEndHour <= data.dayStartHour
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "dayEndHour must be after dayStartHour",
        path: ["dayEndHour"],
      });
    }
  });

export type GenerateStudyPlanInput = z.infer<typeof generateStudyPlanBodySchema>;

type BuildOpts = {
  forecastDays?: number;
};

/** Build a SavedStudyPlan payload using the same week generator as web onboarding. */
export function buildGeneratedStudyPlan(
  input: GenerateStudyPlanInput,
  opts?: BuildOpts
): SavedStudyPlanPayload {
  const start = parseLocalDate(input.planStartDate);
  const exam = parseLocalDate(input.examDate);
  const levelIIIPathway: LevelIIIPathway | null =
    input.examLevel === "III" ? (input.levelIIIPathway ?? null) : null;

  const weekPlan = buildFullWeekPlan({
    start,
    examDate: exam,
    weekStartDay: input.weekStartDay,
    weeklyHours: input.weeklyHours,
    cfaLevel: input.examLevel as CfaLevel,
    levelIIIPathway,
  });

  const serialized = serializeWeekPlan(weekPlan);

  return {
    examLevel: input.examLevel,
    examDate: input.examDate,
    weeklyHours: input.weeklyHours,
    planStartDate: input.planStartDate,
    weekStartDay: input.weekStartDay,
    levelIIIPathway,
    forecastDays: opts?.forecastDays ?? 1,
    calendarPreferredSessionMin: input.calendarPreferredSessionMin ?? 45,
    dayStartHour: input.dayStartHour ?? 7,
    dayEndHour: input.dayEndHour ?? 22,
    weekPlan: serialized,
    baseWeekPlan: serialized,
    actualHours: new Array(weekPlan.length).fill(null),
  };
}
