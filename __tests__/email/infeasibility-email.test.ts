import { describe, it, expect } from "vitest";
import { buildInfeasibilityEmail } from "@/lib/email/infeasibility-email";

describe("buildInfeasibilityEmail", () => {
  const base = {
    firstName: "David",
    unplaceableMinutes: 720, // 12h
    message: "You're 12h behind and your plan can't absorb it within a healthy pace.",
    examDate: "2026-11-15",
    dashboardUrl: "https://mentorforge.co/app",
  };

  it("puts the hours-behind in the subject", () => {
    const { subject } = buildInfeasibilityEmail(base);
    expect(subject).toMatch(/12h/);
    expect(subject.toLowerCase()).toContain("at risk");
  });

  it("greets by first name when present", () => {
    expect(buildInfeasibilityEmail(base).html).toContain("Hi David,");
    expect(buildInfeasibilityEmail(base).text).toContain("Hi David,");
  });

  it("falls back to a generic greeting without a name", () => {
    const { html } = buildInfeasibilityEmail({ ...base, firstName: null });
    expect(html).toContain("Hi,");
  });

  it("includes the honest headline and all three resolution options", () => {
    const { html, text } = buildInfeasibilityEmail(base);
    expect(html).toContain(base.message);
    for (const label of ["Move your exam date", "Cut scope", "Study more per week"]) {
      expect(html).toContain(label);
      expect(text).toContain(label);
    }
  });

  it("links the CTA to the dashboard", () => {
    expect(buildInfeasibilityEmail(base).html).toContain('href="https://mentorforge.co/app"');
    expect(buildInfeasibilityEmail(base).text).toContain("https://mentorforge.co/app");
  });

  it("formats fractional hours", () => {
    expect(buildInfeasibilityEmail({ ...base, unplaceableMinutes: 90 }).subject).toMatch(/1\.5h/);
  });
});
