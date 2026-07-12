import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * Mobile (Expo) native push token registration.
 *  POST   → upsert the caller's Expo push token (idempotent on the token).
 *  DELETE → remove a token (e.g. on sign-out / permission revoke).
 *
 * Auth works for both cookie (web) and Bearer (mobile) via createClient().
 */

const postSchema = z.object({
  expoPushToken: z.string().min(1).max(256),
  platform: z.string().max(40).optional(),
});

export async function POST(req: NextRequest) {
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
  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { expoPushToken, platform } = parsed.data;
  await prisma.mobilePushToken.upsert({
    where: { expoPushToken },
    update: { userId: user.id, platform: platform ?? null },
    create: { userId: user.id, expoPushToken, platform: platform ?? null },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
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
  const token = (raw as { expoPushToken?: unknown })?.expoPushToken;
  if (typeof token !== "string") {
    return NextResponse.json({ error: "expoPushToken required" }, { status: 400 });
  }

  await prisma.mobilePushToken.deleteMany({
    where: { expoPushToken: token, userId: user.id },
  });
  return NextResponse.json({ ok: true });
}
