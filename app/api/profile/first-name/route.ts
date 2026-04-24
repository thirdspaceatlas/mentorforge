import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * GET  /api/profile/first-name  — returns { firstName: string | null } for the signed-in user.
 *                                 Used by the dashboard to decide whether to show the backfill prompt.
 * POST /api/profile/first-name  — sets firstName on the user's profile. Body: { firstName }.
 */

const postBodySchema = z.object({
  firstName: z.string().trim().min(1).max(50)
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { firstName: true }
  });

  return NextResponse.json({ firstName: profile?.firstName ?? null });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = postBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await prisma.profile.update({
    where: { id: user.id },
    data: { firstName: parsed.data.firstName }
  });

  return NextResponse.json({ ok: true });
}
