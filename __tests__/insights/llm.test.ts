import { describe, it, expect, afterEach } from "vitest";
import { llmConfigured, tryLlmBlurbs, parseInsightBlurbsFromText } from "@/lib/insights/llm";
import type { Signals } from "@/lib/insights/insights";

const signals: Signals = {
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

describe("insights llm", () => {
  const origKey = process.env.EMERGENT_LLM_KEY;
  const origBase = process.env.EMERGENT_LLM_BASE_URL;

  afterEach(() => {
    if (origKey === undefined) delete process.env.EMERGENT_LLM_KEY;
    else process.env.EMERGENT_LLM_KEY = origKey;
    if (origBase === undefined) delete process.env.EMERGENT_LLM_BASE_URL;
    else process.env.EMERGENT_LLM_BASE_URL = origBase;
  });

  it("llmConfigured is false when env vars are missing", () => {
    delete process.env.EMERGENT_LLM_KEY;
    delete process.env.EMERGENT_LLM_BASE_URL;
    expect(llmConfigured()).toBe(false);
  });

  it("tryLlmBlurbs returns null without gateway env (no throw)", async () => {
    delete process.env.EMERGENT_LLM_KEY;
    delete process.env.EMERGENT_LLM_BASE_URL;
    await expect(tryLlmBlurbs(signals)).resolves.toBeNull();
  });

  it("parseInsightBlurbsFromText parses plain JSON", () => {
    const out = parseInsightBlurbsFromText(
      '{"readiness":"Week 4 of 16.","coachTip":"Block two sessions."}',
    );
    expect(out).toEqual({
      readiness: "Week 4 of 16.",
      coachTip: "Block two sessions.",
    });
  });

  it("parseInsightBlurbsFromText strips markdown fences", () => {
    const out = parseInsightBlurbsFromText(
      '```json\n{"readiness":"On track.","coachTip":"Review Ethics."}\n```',
    );
    expect(out?.readiness).toBe("On track.");
    expect(out?.coachTip).toBe("Review Ethics.");
  });

  it("parseInsightBlurbsFromText extracts JSON from leading prose", () => {
    const out = parseInsightBlurbsFromText(
      'Here is the JSON:\n{"readiness":"Pace is steady.","coachTip":"Focus on FRA."}',
    );
    expect(out?.readiness).toBe("Pace is steady.");
    expect(out?.coachTip).toBe("Focus on FRA.");
  });

  it("parseInsightBlurbsFromText returns null for invalid payloads", () => {
    expect(parseInsightBlurbsFromText("not json")).toBeNull();
    expect(parseInsightBlurbsFromText('{"readiness":1}')).toBeNull();
  });
});
