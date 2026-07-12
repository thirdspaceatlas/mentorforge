import { describe, it, expect } from "vitest";
import {
  getOffsetMinutes,
  zonedTimeToUtc,
  getZonedParts,
  isValidTimeZone,
} from "@/lib/calendar/timezone";

describe("getOffsetMinutes", () => {
  it("New York is UTC-5 in winter (EST)", () => {
    expect(getOffsetMinutes(new Date("2026-01-15T12:00:00Z"), "America/New_York")).toBe(-300);
  });
  it("New York is UTC-4 in summer (EDT)", () => {
    expect(getOffsetMinutes(new Date("2026-07-15T12:00:00Z"), "America/New_York")).toBe(-240);
  });
  it("Kolkata is UTC+5:30 year-round", () => {
    expect(getOffsetMinutes(new Date("2026-01-15T12:00:00Z"), "Asia/Kolkata")).toBe(330);
  });
  it("UTC is zero", () => {
    expect(getOffsetMinutes(new Date("2026-01-15T12:00:00Z"), "UTC")).toBe(0);
  });
});

describe("zonedTimeToUtc", () => {
  it("7am EST maps to 12:00 UTC (winter)", () => {
    expect(zonedTimeToUtc(2026, 1, 15, 7, 0, "America/New_York").toISOString()).toBe(
      "2026-01-15T12:00:00.000Z",
    );
  });
  it("7am EDT maps to 11:00 UTC (summer)", () => {
    expect(zonedTimeToUtc(2026, 7, 15, 7, 0, "America/New_York").toISOString()).toBe(
      "2026-07-15T11:00:00.000Z",
    );
  });
  it("7am IST maps to 01:30 UTC", () => {
    expect(zonedTimeToUtc(2026, 1, 15, 7, 0, "Asia/Kolkata").toISOString()).toBe(
      "2026-01-15T01:30:00.000Z",
    );
  });
  it("round-trips wall time through UTC and back", () => {
    const utc = zonedTimeToUtc(2026, 7, 15, 9, 30, "America/New_York");
    const parts = getZonedParts(utc, "America/New_York");
    expect([parts.hour, parts.minute]).toEqual([9, 30]);
  });
});

describe("DST boundary — US spring-forward 2026-03-08", () => {
  it("offset flips from -300 (EST) to -240 (EDT) across the 2am transition", () => {
    const beforeTransition = getOffsetMinutes(new Date("2026-03-08T06:00:00Z"), "America/New_York"); // 01:00 EST
    const afterTransition = getOffsetMinutes(new Date("2026-03-08T08:00:00Z"), "America/New_York"); // 04:00 EDT
    expect(beforeTransition).toBe(-300);
    expect(afterTransition).toBe(-240);
  });
  it("7am wall time on the DST day resolves to EDT (11:00 UTC)", () => {
    expect(zonedTimeToUtc(2026, 3, 8, 7, 0, "America/New_York").toISOString()).toBe(
      "2026-03-08T11:00:00.000Z",
    );
  });
});

describe("isValidTimeZone", () => {
  it("accepts IANA zones", () => {
    expect(isValidTimeZone("America/New_York")).toBe(true);
    expect(isValidTimeZone("Asia/Kolkata")).toBe(true);
    expect(isValidTimeZone("UTC")).toBe(true);
  });
  it("rejects garbage", () => {
    expect(isValidTimeZone("Not/AZone")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
  });
});
