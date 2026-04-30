import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/profile/onboarding — CRM fields for Calendar Coach onboarding prefill.
 * Returns { profile: { lastName, credentialType, primaryChallenge, employerType, attribution } | null }
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: {
      lastName: true,
      credentialType: true,
      primaryChallenge: true,
      employerType: true,
      attribution: true,
    },
  });

  if (!profile) {
    return NextResponse.json({ profile: null });
  }

  return NextResponse.json({
    profile: {
      lastName: profile.lastName ?? null,
      credentialType: profile.credentialType ?? null,
      primaryChallenge: profile.primaryChallenge ?? null,
      employerType: profile.employerType ?? null,
      attribution: profile.attribution ?? null,
    },
  });
}
