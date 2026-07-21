import { describe, expect, it } from "vitest";
import {
  clampWorkingHours,
  formatFractionalHourLabel,
  hourToTimeValue,
  joinHourMinute,
  splitFractionalHour,
  timeValueToHour,
} from "@/lib/study-plan/working-hours";

describe("working-hours", () => {
  it("splits and joins fractional hours", () => {
    expect(splitFractionalHour(7.5)).toEqual({ h: 7, m: 30 });
    expect(joinHourMinute(7, 30)).toBe(7.5);
    expect(splitFractionalHour(24)).toEqual({ h: 24, m: 0 });
  });

  it("formats labels with minutes", () => {
    expect(formatFractionalHourLabel(7)).toBe("7am");
    expect(formatFractionalHourLabel(7.5)).toBe("7:30am");
    expect(formatFractionalHourLabel(22)).toBe("10pm");
    expect(formatFractionalHourLabel(24)).toBe("12am");
  });

  it("round-trips time inputs", () => {
    expect(hourToTimeValue(7.5)).toBe("07:30");
    expect(timeValueToHour("07:30")).toBe(7.5);
    expect(timeValueToHour("00:00", true)).toBe(24);
    expect(timeValueToHour("00:00", false)).toBe(0);
  });

  it("clamps inverted ranges", () => {
    const { dayStartHour, dayEndHour } = clampWorkingHours(18, 9);
    expect(dayEndHour).toBeGreaterThan(dayStartHour);
  });
});
