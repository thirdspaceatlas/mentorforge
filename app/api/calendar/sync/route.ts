import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { syncUser } from "@/lib/calendar/sync";

/**
 * POST /api/calendar/sync — Trigger calendar sync for the authenticated user.
 * Called on demand (e.g. after onboarding, or manual refresh).
 *
 * Returns sync results per connection.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const results = await syncUser(user.id);

  return NextResponse.json({ results });
}
