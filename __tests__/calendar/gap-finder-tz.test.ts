import { describe, it, expect } from "vitest";
import { findGapsForDay, findGaps } from "@/lib/calendar/gap-finder";
import { getZonedParts, zonedTimeToUtc } from "@/lib/calendar/timezone";

/** Large cap so tests assert calendar geometry without max-session chunking. */
const NO_CHUNK = { maxSessionMin: 10080 } as const;

describe("gap-finder — tz-aware waking hours", () => {
  it("computes day boundaries in the USER's timezone, not the server's", () => {
    // Same absolute instant, two different users → different local waking windows.
    const instant = new Date("2026-01-15T17:00:00Z");
    const ny = findGapsForDay(instant, [], { ...NO_CHUNK, timeZone: "America/New_York" });
    const kol = findGapsForDay(instant, [], { ...NO_CHUNK, timeZone: "Asia/Kolkata" });

    // Each user still gets a full 7am–10pm gap (900 min)…
    expect(ny[0].durationMin).toBe(900);
    expect(kol[0].durationMin).toBe(900);
    // …but anchored to their OWN local 7am, i.e. different UTC instants.
    expect(ny[0].start.toISOString()).toBe("2026-01-15T12:00:00.000Z"); // 7am EST
    expect(kol[0].start.toISOString()).toBe("2026-01-15T01:30:00.000Z"); // 7am IST
  });

  it("waking window starts 7am / ends 10pm local on a DST boundary day", () => {
    const gaps = findGapsForDay(new Date("2026-03-08T18:00:00Z"), [], {
      ...NO_CHUNK,
      timeZone: "America/New_York",
    });
    const startParts = getZonedParts(gaps[0].start, "America/New_York");
    const endParts = getZonedParts(gaps[gaps.length - 1].end, "America/New_York");
    expect(startParts.hour).toBe(7);
    expect(endParts.hour).toBe(22);
  });

  it("clips a busy period using user-local boundaries", () => {
    // Busy 06:00–08:00 NY; waking starts at 07:00 NY → first gap begins at 08:00 NY (13:00 UTC).
    const busy = [
      {
        start: zonedTimeToUtc(2026, 1, 15, 6, 0, "America/New_York"),
        end: zonedTimeToUtc(2026, 1, 15, 8, 0, "America/New_York"),
      },
    ];
    const gaps = findGapsForDay(new Date("2026-01-15T17:00:00Z"), busy, {
      ...NO_CHUNK,
      timeZone: "America/New_York",
    });
    expect(gaps[0].start.toISOString()).toBe("2026-01-15T13:00:00.000Z");
  });

  it("backward compatible: omitting timeZone uses server-local behavior", () => {
    // No timeZone → same as the legacy path (one full waking gap).
    const gaps = findGapsForDay(new Date(2026, 0, 15), [], NO_CHUNK);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].durationMin).toBe(900);
  });
});

describe("findGaps (multi-day, tz-aware)", () => {
  it("produces one waking gap per user-local day across a range", () => {
    const start = new Date("2026-01-15T09:00:00Z");
    const end = new Date("2026-01-17T20:00:00Z");
    const gaps = findGaps(start, end, [], { ...NO_CHUNK, timeZone: "America/New_York" });
    // 3 local days (Jan 15,16,17), each a 900-min gap.
    expect(gaps).toHaveLength(3);
    gaps.forEach((g) => expect(g.durationMin).toBe(900));
    expect(gaps[0].start.toISOString()).toBe("2026-01-15T12:00:00.000Z");
    expect(gaps[1].start.toISOString()).toBe("2026-01-16T12:00:00.000Z");
    expect(gaps[2].start.toISOString()).toBe("2026-01-17T12:00:00.000Z");
  });
});
