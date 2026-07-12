import { describe, it, expect } from "vitest";
import { recommendTopic } from "@/lib/plan/nudge/recommend-topic";

const topics = [
  { id: "a", name: "Alpha", recommendedHours: 10 },
  { id: "b", name: "Beta", recommendedHours: 10 },
  { id: "c", name: "Gamma", recommendedHours: 10 },
];

const day = (n: number) => new Date(Date.UTC(2026, 0, 1 + n));

describe("recommendTopic", () => {
  it("returns the first topic at the very start of the plan", () => {
    const r = recommendTopic({
      planStartDate: "2026-01-01",
      examDate: "2026-01-31", // 30-day plan
      now: day(0),
      topics,
    });
    expect(r?.topicName).toBe("Alpha");
  });

  it("advances to the middle topic around the halfway point", () => {
    const r = recommendTopic({
      planStartDate: "2026-01-01",
      examDate: "2026-01-31",
      now: day(15), // ~50% elapsed
      topics,
    });
    expect(r?.topicName).toBe("Beta");
  });

  it("lands on the final topic near the end", () => {
    const r = recommendTopic({
      planStartDate: "2026-01-01",
      examDate: "2026-01-31",
      now: day(29),
      topics,
    });
    expect(r?.topicName).toBe("Gamma");
  });

  it("weights by recommended hours (heavier topic spans more of the timeline)", () => {
    const weighted = [
      { id: "a", name: "Alpha", recommendedHours: 80 },
      { id: "b", name: "Beta", recommendedHours: 20 },
    ];
    // 50% elapsed but Alpha covers the first 80% of the hours-curve.
    const r = recommendTopic({
      planStartDate: "2026-01-01",
      examDate: "2026-01-31",
      now: day(15),
      topics: weighted,
    });
    expect(r?.topicName).toBe("Alpha");
  });

  it("uses 'review' study type inside the final 21 days", () => {
    const r = recommendTopic({
      planStartDate: "2026-01-01",
      examDate: "2026-02-01",
      now: new Date(Date.UTC(2026, 0, 25)), // ~7 days out
      topics,
    });
    expect(r?.studyType).toBe("review");
  });

  it("uses 'new' early in a long plan", () => {
    const r = recommendTopic({
      planStartDate: "2026-01-01",
      examDate: "2026-06-01", // long plan
      now: new Date(Date.UTC(2026, 0, 10)),
      topics,
    });
    expect(r?.studyType).toBe("new");
  });

  it("returns null for invalid or inverted dates", () => {
    expect(
      recommendTopic({ planStartDate: "2026-02-01", examDate: "2026-01-01", now: day(0), topics }),
    ).toBeNull();
    expect(recommendTopic({ planStartDate: "x", examDate: "y", now: day(0), topics })).toBeNull();
  });

  it("returns null for an empty syllabus", () => {
    expect(
      recommendTopic({ planStartDate: "2026-01-01", examDate: "2026-02-01", now: day(0), topics: [] }),
    ).toBeNull();
  });
});
