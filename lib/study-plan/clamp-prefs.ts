import {
  DEFAULT_DAY_END,
  DEFAULT_DAY_START,
  clampWorkingHours,
} from "./working-hours";

type ExistingPrefs = {
  forecastDays?: number;
  calendarPreferredSessionMin?: number;
  dayStartHour?: number;
  dayEndHour?: number;
} | null;

type PrefsInput = {
  forecastDays?: number | null;
  calendarPreferredSessionMin?: number | null;
  dayStartHour?: number | null;
  dayEndHour?: number | null;
};

export function clampStudyPlanPrefs(input: PrefsInput, existing?: ExistingPrefs) {
  const rawPref =
    input.calendarPreferredSessionMin != null
      ? Number(input.calendarPreferredSessionMin)
      : (existing?.calendarPreferredSessionMin ?? 45);
  const calendarPreferredSessionMin = Number.isFinite(rawPref)
    ? Math.min(180, Math.max(5, Math.round(rawPref)))
    : Math.min(180, Math.max(5, existing?.calendarPreferredSessionMin ?? 45));

  let forecastDays = existing?.forecastDays ?? 1;
  if (input.forecastDays != null) {
    const n = Number(input.forecastDays);
    if (n === 1 || n === 3 || n === 5) forecastDays = n;
  }

  const startRaw =
    input.dayStartHour != null ? Number(input.dayStartHour) : (existing?.dayStartHour ?? DEFAULT_DAY_START);
  const endRaw =
    input.dayEndHour != null ? Number(input.dayEndHour) : (existing?.dayEndHour ?? DEFAULT_DAY_END);
  const { dayStartHour, dayEndHour } = clampWorkingHours(
    Number.isFinite(startRaw) ? startRaw : DEFAULT_DAY_START,
    Number.isFinite(endRaw) ? endRaw : DEFAULT_DAY_END
  );

  return { forecastDays, calendarPreferredSessionMin, dayStartHour, dayEndHour };
}
