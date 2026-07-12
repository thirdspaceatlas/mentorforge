import { describe, it, expect } from "vitest";
import { buildPrompt, fallback, signatureOf, type Signals } from "@/lib/insights/insights";

const base: Signals = {
  examLevel: "I",
  examDate: "2026-11-15",
  daysToExam: 120,
  totalWeeks: 16,
  completedWeeks: 4,
  hoursLogged: 8,
  hoursPlanned: 10,
  pacePercent: 80,
  feasible: true,
  currentTopic: "Ethics",
};

describe("insights", () => {
  it("signatureOf is stable for the same signals", () => {
    expect(signatureOf(base)).toBe(signatureOf({ ...base }));
  });

  it("signatureOf changes when signals change", () => {
    expect(signatureOf(base)).not.toBe(signatureOf({ ...base, daysToExam: 119 }));
  });

  it("buildPrompt embeds signal data", () => {
    const prompt = buildPrompt(base);
    expect(prompt).toContain("readiness");
    expect(prompt).toContain("coachTip");
    expect(prompt).toContain("Ethics");
    expect(prompt).toContain('"daysToExam": 120');
  });

  it("fallback returns readiness and coachTip blurbs", () => {
    const out = fallback(base);
    expect(out.readiness).toContain("week 5 of 16");
    expect(out.readiness).toContain("Level I");
    expect(out.coachTip).toContain("Ethics");
  });

  it("fallback reflects infeasible plans", () => {
    const out = fallback({ ...base, feasible: false, pacePercent: 50 });
    expect(out.readiness).toContain("tighten the plan");
  });
});
