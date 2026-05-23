import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * GET  /api/profile/communications — { emailCommunicationsOptIn: boolean }
 * PATCH /api/profile/communications — body: { emailCommunicationsOptIn: boolean }
 */

const patchBodySchema = z.object({
  emailCommunicationsOptIn: z.boolean(),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { emailCommunicationsOptIn: true },
  });

  return NextResponse.json({
    emailCommunicationsOptIn: profile?.emailCommunicationsOptIn ?? false,
  });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await prisma.profile.update({
    where: { id: user.id },
    data: { emailCommunicationsOptIn: parsed.data.emailCommunicationsOptIn },
  });

  return NextResponse.json({ ok: true, emailCommunicationsOptIn: parsed.data.emailCommunicationsOptIn });
}
