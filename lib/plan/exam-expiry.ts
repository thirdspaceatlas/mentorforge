import { z } from "zod";

export const examWindowSchema = z.enum(["february", "may", "august", "november"]);
export type ExamWindow = z.infer<typeof examWindowSchema>;

/** 2 weeks after the last day of the exam window month → fixed calendar day (see product spec). */
export function calculateLevelPassAccessExpiresAt(examWindow: ExamWindow, examYear: number): Date {
  const end = {
    february: { monthIndex: 2, day: 14 }, // March 14
    may: { monthIndex: 5, day: 14 }, // June 14
    august: { monthIndex: 8, day: 14 }, // September 14
    november: { monthIndex: 11, day: 14 } // December 14
  }[examWindow];

  return new Date(examYear, end.monthIndex, end.day, 23, 59, 59, 999);
}
