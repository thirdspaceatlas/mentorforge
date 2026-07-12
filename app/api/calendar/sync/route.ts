import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncUser } from "@/lib/calendar/sync";
import { syncDeviceBusy } from "@/lib/calendar/device-sync";

/**
 * POST /api/calendar/sync — Trigger calendar sync for the authenticated user.
 *
 * Two modes:
 *  - Web (no body): sync all OAuth connections, then regenerate windows.
 *  - Mobile (body `{ busyPeriods: [{start,end}] }`): ingest device-calendar busy
 *    periods (expo-calendar) and regenerate windows via the same gap-finder.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (body && Array.isArray(body.busyPeriods)) {
    const windowsCreated = await syncDeviceBusy(user.id, body.busyPeriods);
    return NextResponse.json({ results: { source: "device", windowsCreated } });
  }

  const results = await syncUser(user.id);
  return NextResponse.json({ results });
}
