import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    savedStudyPlan: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    studySession: { findMany: vi.fn() },
    infeasibilityEvent: { count: vi.fn() },
  },
}));

vi.mock("@/lib/insights/llm", () => ({
  tryLlmBlurbs: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { tryLlmBlurbs } from "@/lib/insights/llm";
import { GET } from "@/app/api/insights/route";

const plan = {
  examLevel: "I",
  examDate: "2026-11-15",
  weeklyHours: 10,
  planStartDate: "2026-01-01",
  weekPlan: [{}, {}, {}, {}, {}],
  insightSignature: null,
  insightReadiness: null,
  insightCoachTip: null,
  insightGeneratedAt: null,
};

describe("GET /api/insights", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
    } as never);
    vi.mocked(prisma.savedStudyPlan.findUnique).mockResolvedValue(plan as never);
    vi.mocked(prisma.studySession.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.infeasibilityEvent.count).mockResolvedValue(0);
    vi.mocked(prisma.savedStudyPlan.update).mockResolvedValue(plan as never);
    vi.mocked(tryLlmBlurbs).mockResolvedValue(null);
  });

  it("returns 200 with fallback blurbs when LLM is unavailable", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.readiness).toMatch(/week \d+ of \d+/);
    expect(body.coachTip).toContain("Block two focused sessions");
    expect(body.cached).toBe(false);
    expect(body.source).toBe("fallback");
    expect(body.generatedAt).toBeTruthy();
  });
});
