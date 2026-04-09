import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncConnection } from "@/lib/calendar/sync";

/**
 * GET /api/cron/sync-calendars — Hourly calendar sync for all users.
 *
 * Vercel Cron sends GET requests with Authorization: Bearer <CRON_SECRET>.
 *
 * Processing strategy:
 * - Fetches all enabled connections
 * - Processes in parallel batches (Promise.allSettled) to prevent one failure from blocking others
 * - Cursor-based: processes connections by ID order so crashes can resume
 * - Structured JSON logging for observability
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization");

  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  // Fetch all enabled connections, ordered by ID for cursor-based resume
  const connections = await prisma.calendarConnection.findMany({
    where: { enabled: true },
    select: { id: true, userId: true, provider: true },
    orderBy: { id: "asc" },
  });

  console.log(
    JSON.stringify({
      event: "cron_sync_start",
      connections: connections.length,
      ts: new Date().toISOString(),
    })
  );

  // Process in batches of 10 to avoid overwhelming provider APIs
  const BATCH_SIZE = 10;
  const results: {
    connectionId: string;
    userId: string;
    eventsUpserted: number;
    windowsCreated: number;
    error?: string;
  }[] = [];

  for (let i = 0; i < connections.length; i += BATCH_SIZE) {
    const batch = connections.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.allSettled(
      batch.map((c) => syncConnection(c.id))
    );

    for (let j = 0; j < batch.length; j++) {
      const conn = batch[j];
      const result = batchResults[j];

      if (result.status === "fulfilled") {
        results.push({ connectionId: conn.id, userId: conn.userId, ...result.value });
      } else {
        const errorMsg = result.reason instanceof Error ? result.reason.message : String(result.reason);
        results.push({
          connectionId: conn.id,
          userId: conn.userId,
          eventsUpserted: 0,
          windowsCreated: 0,
          error: errorMsg,
        });
        console.error(
          JSON.stringify({
            event: "cron_sync_error",
            connectionId: conn.id,
            userId: conn.userId,
            error: errorMsg,
          })
        );
      }
    }
  }

  const duration = Date.now() - startTime;
  const totalEvents = results.reduce((s, r) => s + r.eventsUpserted, 0);
  const totalWindows = results.reduce((s, r) => s + r.windowsCreated, 0);
  const errors = results.filter((r) => r.error).length;

  console.log(
    JSON.stringify({
      event: "cron_sync_complete",
      connections: connections.length,
      events_upserted: totalEvents,
      windows_created: totalWindows,
      errors,
      duration_ms: duration,
      ts: new Date().toISOString(),
    })
  );

  return NextResponse.json({
    synced: connections.length,
    events: totalEvents,
    windows: totalWindows,
    errors,
    durationMs: duration,
  });
}
