import { describe, it, expect } from "vitest";
import {
  buildMicroDose,
  decideNudge,
  buildNudgePayload,
  MIN_MICRO_DOSE_MIN,
  MAX_MICRO_DOSE_MIN,
} from "@/lib/plan/nudge/micro-dose";

describe("buildMicroDose", () => {
  it("builds a dose from a real topic and workable gap", () => {
    expect(buildMicroDose({ gapMinutes: 30, topicName: "Equity", studyType: "review" })).toEqual({
      topicName: "Equity",
      activity: "Review",
      minutes: 30,
    });
  });
  it("caps the dose at MAX_MICRO_DOSE_MIN", () => {
    expect(buildMicroDose({ gapMinutes: 120, topicName: "Fixed Income" })?.minutes).toBe(MAX_MICRO_DOSE_MIN);
  });
  it("returns null when the gap is too short", () => {
    expect(buildMicroDose({ gapMinutes: MIN_MICRO_DOSE_MIN - 1, topicName: "Equity" })).toBeNull();
  });
  it("returns null with no reliable topic", () => {
    expect(buildMicroDose({ gapMinutes: 30, topicName: null })).toBeNull();
    expect(buildMicroDose({ gapMinutes: 30, topicName: "  " })).toBeNull();
  });
  it("maps study type to an activity verb", () => {
    expect(buildMicroDose({ gapMinutes: 30, topicName: "X", studyType: "practice" })?.activity).toBe(
      "Practice questions on",
    );
    expect(buildMicroDose({ gapMinutes: 30, topicName: "X", studyType: "new" })?.activity).toBe("Preview");
  });
});

describe("decideNudge — reliable-nudge rule", () => {
  it("fires only when a reliable suggestion exists", () => {
    const yes = decideNudge({ gapMinutes: 30, topicName: "Ethics", studyType: "review" });
    expect(yes.shouldNudge).toBe(true);
  });
  it("does not fire when the gap is too short", () => {
    const no = decideNudge({ gapMinutes: 5, topicName: "Ethics" });
    expect(no).toEqual({ shouldNudge: false, reason: "gap-too-short" });
  });
  it("does not fire without a topic", () => {
    const no = decideNudge({ gapMinutes: 30, topicName: null });
    expect(no).toEqual({ shouldNudge: false, reason: "no-reliable-suggestion" });
  });
});

describe("buildNudgePayload", () => {
  it("offers both micro-dose and open-materials", () => {
    const p = buildNudgePayload({
      windowId: "w1",
      minutesUntil: 20,
      gapMinutes: 40,
      topicName: "Derivatives",
      studyType: "practice",
    });
    expect(p).not.toBeNull();
    expect(p!.title).toMatch(/in 20 min/);
    expect(p!.body).toMatch(/or open your own materials/i);
    expect(p!.actions.map((a) => a.action)).toEqual(["micro-dose", "open-materials"]);
    expect(p!.tag).toBe("window-w1");
  });
  it("uses 'open now' copy when imminent", () => {
    const p = buildNudgePayload({ windowId: "w2", minutesUntil: 3, gapMinutes: 30, topicName: "Equity" });
    expect(p!.title).toMatch(/open now/);
  });
  it("returns null (no nudge) when no reliable suggestion", () => {
    expect(
      buildNudgePayload({ windowId: "w3", minutesUntil: 10, gapMinutes: 30, topicName: null }),
    ).toBeNull();
  });
});
