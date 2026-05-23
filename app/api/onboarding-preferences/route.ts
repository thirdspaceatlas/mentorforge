import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/onboarding-preferences — Save onboarding choices so the planner
 * can pre-fill when the user first visits /app.
 *
 * Saves two things:
 *   1. SavedStudyPlan pre-fill (only if one doesn't exist; never overwrites an existing plan).
 *   2. CRM fields on the user's Profile (credentialType, lastName, primaryChallenge,
 *      employerType, attribution). All optional — empty strings are ignored.
 *
 * Plan-generation fields (examLevel, examDate, weeklyHours) are required.
 */

const CREDENTIAL_TYPES = new Set(["CFA", "CFP_waitlist", "other"]);
const PRIMARY_CHALLENGES = new Set([
  "cant_find_time",
  "lose_focus",
  "fall_behind",
  "dont_know_pace",
  "other"
]);
const EMPLOYER_TYPES = new Set([
  "buy_side",
  "sell_side",
  "corporate_finance",
  "wealth_management",
  "banking",
  "student",
  "other"
]);

function normalizeString(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim().slice(0, max);
  return trimmed.length === 0 ? undefined : trimmed;
}

function normalizeEnum(v: unknown, allowed: Set<string>): string | undefined {
  if (typeof v !== "string") return undefined;
  return allowed.has(v) ? v : undefined;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { examLevel, examDate, weeklyHours, weekStartDay } = body;

  if (!examLevel || !examDate || weeklyHours == null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const crmUpdate: Record<string, string> = {};
  const credentialType = normalizeEnum(body.credentialType, CREDENTIAL_TYPES);
  if (credentialType) crmUpdate.credentialType = credentialType;
  const primaryChallenge = normalizeEnum(body.primaryChallenge, PRIMARY_CHALLENGES);
  if (primaryChallenge) crmUpdate.primaryChallenge = primaryChallenge;
  const employerType = normalizeEnum(body.employerType, EMPLOYER_TYPES);
  if (employerType) crmUpdate.employerType = employerType;
  const lastName = normalizeString(body.lastName, 50);
  if (lastName) crmUpdate.lastName = lastName;
  const attribution = normalizeString(body.attribution, 80);
  if (attribution) crmUpdate.attribution = attribution;

  if (typeof body.emailCommunicationsOptIn === "boolean") {
    await prisma.profile.update({
      where: { id: user.id },
      data: { emailCommunicationsOptIn: body.emailCommunicationsOptIn },
    });
  }

  if (Object.keys(crmUpdate).length > 0) {
    await prisma.profile.update({
      where: { id: user.id },
      data: crmUpdate
    });
  }

  const existing = await prisma.savedStudyPlan.findUnique({
    where: { userId: user.id }
  });

  if (existing) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  await prisma.savedStudyPlan.create({
    data: {
      userId: user.id,
      examLevel,
      examDate,
      weeklyHours: Number(weeklyHours),
      planStartDate: new Date().toISOString().slice(0, 10),
      weekStartDay: weekStartDay || "1",
      levelIIIPathway: null,
      weekPlan: [],
      baseWeekPlan: [],
      actualHours: []
    }
  });

  return NextResponse.json({ ok: true });
}
