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
    input.dayStartHour != null ? Number(input.dayStartHour) : (existing?.dayStartHour ?? 7);
  const endRaw =
    input.dayEndHour != null ? Number(input.dayEndHour) : (existing?.dayEndHour ?? 22);
  const dayStartHour = Number.isFinite(startRaw)
    ? Math.min(23, Math.max(0, Math.round(startRaw)))
    : (existing?.dayStartHour ?? 7);
  const dayEndHour = Number.isFinite(endRaw)
    ? Math.min(24, Math.max(dayStartHour + 1, Math.round(endRaw)))
    : Math.max(dayStartHour + 1, existing?.dayEndHour ?? 22);

  return { forecastDays, calendarPreferredSessionMin, dayStartHour, dayEndHour };
}
