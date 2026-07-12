import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { finishCronRun } from "@/lib/cron/summary";
import { syncConnection, regenerateWindows } from "@/lib/calendar/sync";

/**
 * GET /api/cron/sync-calendars — near-real-time calendar sync for all users
 * (runs every 5 min, Phase 3) so cancelled/shortened meetings surface as fresh
 * study windows within minutes rather than up to an hour later.
 *
 * Vercel Cron sends GET requests with Authorization: Bearer <CRON_SECRET>.
 *
 * Two-phase processing:
 *  Phase 1: fan out event syncs across all connections in parallel batches.
 *  Phase 2: regenerate study windows once per affected user, in parallel across
 *           users. Per-connection regenerate would race for users with multiple
 *           calendars and produce duplicate windows.
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization");

  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  const connections = await prisma.calendarConnection.findMany({
    where: { enabled: true },
    select: { id: true, userId: true, provider: true },
    orderBy: { id: "asc" },
  });

  const BATCH_SIZE = 10;
  const eventResults: {
    connectionId: string;
    userId: string;
    eventsUpserted: number;
    error?: string;
  }[] = [];
  const errors: { connectionId?: string; userId?: string; error: string }[] = [];

  for (let i = 0; i < connections.length; i += BATCH_SIZE) {
    const batch = connections.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.allSettled(
      batch.map((c) => syncConnection(c.id)),
    );

    for (let j = 0; j < batch.length; j++) {
      const conn = batch[j];
      const result = batchResults[j];

      if (result.status === "fulfilled") {
        const row = { connectionId: conn.id, userId: conn.userId, ...result.value };
        eventResults.push(row);
        if (row.error) {
          errors.push({ connectionId: conn.id, userId: conn.userId, error: row.error });
        }
      } else {
        const errorMsg =
          result.reason instanceof Error ? result.reason.message : String(result.reason);
        eventResults.push({
          connectionId: conn.id,
          userId: conn.userId,
          eventsUpserted: 0,
          error: errorMsg,
        });
        errors.push({ connectionId: conn.id, userId: conn.userId, error: errorMsg });
      }
    }
  }

  const affectedUserIds = Array.from(
    new Set(eventResults.filter((r) => !r.error).map((r) => r.userId)),
  );

  let totalWindows = 0;
  let regenErrors = 0;
  for (let i = 0; i < affectedUserIds.length; i += BATCH_SIZE) {
    const batch = affectedUserIds.slice(i, i + BATCH_SIZE);
    const regenResults = await Promise.allSettled(
      batch.map((uid) => regenerateWindows(uid)),
    );
    for (let j = 0; j < batch.length; j++) {
      const r = regenResults[j];
      if (r.status === "fulfilled") {
        totalWindows += r.value;
      } else {
        regenErrors++;
        const errorMsg =
          r.reason instanceof Error ? r.reason.message : String(r.reason);
        errors.push({ userId: batch[j], error: errorMsg });
      }
    }
  }

  const durationMs = Date.now() - startTime;
  const totalEvents = eventResults.reduce((s, r) => s + r.eventsUpserted, 0);
  const eventErrors = eventResults.filter((r) => r.error).length;
  const errorCount = errors.length;

  return finishCronRun(
    {
      route: "/api/cron/sync-calendars",
      durationMs,
      processed: connections.length,
      sent: totalWindows,
      errorCount,
      connections: connections.length,
      users: affectedUserIds.length,
      events: totalEvents,
      windows: totalWindows,
      eventErrors,
      regenErrors,
    },
    {
      synced: connections.length,
      users: affectedUserIds.length,
      events: totalEvents,
      windows: totalWindows,
      eventErrors,
      regenErrors,
      durationMs,
      errors,
    },
  );
}
