import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/util/retry";
import { getValidAccessToken, OAuthRevokedError } from "./token-refresh";
import { fetchGoogleEvents, fetchOutlookEvents, toBusyPeriods } from "./providers";
import type { ProviderEvent } from "./providers";
import { findGaps } from "./gap-finder";

async function getPreferredMaxSessionMin(userId: string): Promise<number> {
  const row = await prisma.savedStudyPlan.findUnique({
    where: { userId },
    select: { calendarPreferredSessionMin: true },
  });
  const n = row?.calendarPreferredSessionMin ?? 45;
  return Math.min(180, Math.max(5, n));
}

const DEFAULT_DAY_START = 7;
const DEFAULT_DAY_END = 22;

async function getWorkingHours(
  userId: string
): Promise<{ dayStartHour: number; dayEndHour: number; timeZone?: string }> {
  const row = await prisma.savedStudyPlan.findUnique({
    where: { userId },
    select: { dayStartHour: true, dayEndHour: true },
  });
  // Per-user IANA timezone (Phase 2) so waking-hour boundaries are user-local.
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { timeZone: true },
  });
  const startRaw = row?.dayStartHour ?? DEFAULT_DAY_START;
  const endRaw = row?.dayEndHour ?? DEFAULT_DAY_END;
  // Clamp to sane bounds and ensure end > start so the gap finder never inverts.
  const dayStartHour = Math.min(23, Math.max(0, startRaw));
  const dayEndHour = Math.min(24, Math.max(dayStartHour + 1, endRaw));
  return { dayStartHour, dayEndHour, timeZone: profile?.timeZone ?? undefined };
}

/**
 * Sync a single calendar connection's events into the CalendarEvent table.
 * Does NOT regenerate StudyWindow rows — callers must invoke
 * regenerateWindows(userId) exactly once after all of a user's connections
 * have been synced. Calling regenerate per-connection would race when a user
 * has multiple connections syncing in parallel and produce duplicate windows.
 */
export async function syncConnection(connectionId: string): Promise<{
  eventsUpserted: number;
  error?: string;
}> {
  const connection = await prisma.calendarConnection.findUniqueOrThrow({
    where: { id: connectionId },
  });

  if (!connection.enabled) {
    return { eventsUpserted: 0 };
  }

  // Device connections (mobile expo-calendar) are populated by syncDeviceBusy,
  // not by an OAuth fetch — nothing to sync here, and their token fields are
  // placeholders that must never be decrypted.
  if (connection.provider === "device") {
    return { eventsUpserted: 0 };
  }

  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(connectionId);
  } catch (err) {
    if (err instanceof OAuthRevokedError) {
      // Disable the connection — user needs to re-authorize
      await prisma.calendarConnection.update({
        where: { id: connectionId },
        data: { enabled: false },
      });
      return { eventsUpserted: 0, error: err.message };
    }
    throw err;
  }

  // Fetch next 7 days of events
  const timeMin = new Date();
  const timeMax = new Date();
  timeMax.setDate(timeMax.getDate() + 7);

  let events: ProviderEvent[];
  if (connection.provider === "google") {
    events = await withRetry(() => fetchGoogleEvents(accessToken, timeMin, timeMax));
  } else if (connection.provider === "outlook") {
    events = await withRetry(() => fetchOutlookEvents(accessToken, timeMin, timeMax));
  } else {
    return { eventsUpserted: 0, error: `Unknown provider: ${connection.provider}` };
  }

  // Upsert events into CalendarEvent table
  let eventsUpserted = 0;
  for (const ev of events) {
    await prisma.calendarEvent.upsert({
      where: {
        connectionId_providerEventId: {
          connectionId: connection.id,
          providerEventId: ev.providerEventId,
        },
      },
      update: {
        startTime: ev.start,
        endTime: ev.end,
        busyStatus: ev.busyStatus,
        lastSyncedAt: new Date(),
      },
      create: {
        connectionId: connection.id,
        providerEventId: ev.providerEventId,
        startTime: ev.start,
        endTime: ev.end,
        busyStatus: ev.busyStatus,
      },
    });
    eventsUpserted++;
  }

  return { eventsUpserted };
}

/**
 * Regenerate study windows for a user from all their calendar events.
 *
 * Race-safety: takes a Postgres transaction-scoped advisory lock keyed on the
 * userId so two concurrent regenerate calls for the same user serialize. Without
 * this lock, parallel runs read the same `existingWindows` snapshot and each
 * inserts its own copy of every gap, producing 2× duplicates per synced calendar.
 *
 * Strategy (idempotent — safe to re-run on every sync without bloating the DB):
 * 1. Gather all busy periods from all enabled connections (next 7 days)
 * 2. Run gap finder against the current calendar state
 * 3. Diff existing future windows against current gaps:
 *    - Window matches a current gap → keep (preserves `notified`, `topicName`, sessions)
 *    - Window doesn't match AND has no session → stale, delete
 *    - Window doesn't match AND has a session → keep (study history)
 *    - Current gap with no matching window → create new
 *
 * Past windows (startTime < now) are never touched — they're history.
 */
export async function regenerateWindows(userId: string): Promise<number> {
  const now = new Date();
  const sevenDaysOut = new Date();
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);

  const maxSessionMin = await getPreferredMaxSessionMin(userId);
  const { dayStartHour, dayEndHour, timeZone } = await getWorkingHours(userId);

  return prisma.$transaction(
    async (tx) => {
      // Per-user advisory lock — auto-released when transaction ends.
      // Concurrent regen calls for the same user serialize on this lock; the
      // first one runs, the second waits and then re-reads existingWindows so
      // it doesn't reinsert the gaps the first call already wrote.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}), 0)`;

      const allEvents = await tx.calendarEvent.findMany({
        where: {
          connection: { userId, enabled: true },
          startTime: { lte: sevenDaysOut },
          endTime: { gte: now },
        },
        select: { startTime: true, endTime: true, busyStatus: true },
      });

      const busyPeriods = allEvents
        .filter((e) => e.busyStatus !== "free")
        .map((e) => ({ start: e.startTime, end: e.endTime }));

      const gaps = findGaps(now, sevenDaysOut, busyPeriods, {
        minSessionMin: 5,
        maxSessionMin,
        dayStartHour,
        dayEndHour,
        timeZone,
      });

      const existingWindows = await tx.studyWindow.findMany({
        where: {
          userId,
          startTime: { gte: now },
          endTime: { lte: sevenDaysOut },
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          sessions: { select: { id: true }, take: 1 },
        },
      });

      const isMatch = (
        gap: { start: Date; end: Date },
        win: { startTime: Date; endTime: Date }
      ) => {
        const startDiff = Math.abs(gap.start.getTime() - win.startTime.getTime());
        const endDiff = Math.abs(gap.end.getTime() - win.endTime.getTime());
        return startDiff < 60000 && endDiff < 60000;
      };

      const matchedWindowIds = new Set<string>();
      const newGaps: typeof gaps = [];

      for (const gap of gaps) {
        const match = existingWindows.find((w) => isMatch(gap, w));
        if (match) {
          matchedWindowIds.add(match.id);
        } else {
          newGaps.push(gap);
        }
      }

      const staleWindowIds = existingWindows
        .filter((w) => !matchedWindowIds.has(w.id) && w.sessions.length === 0)
        .map((w) => w.id);

      if (staleWindowIds.length > 0) {
        await tx.studyWindow.deleteMany({
          where: { id: { in: staleWindowIds } },
        });
      }
      if (newGaps.length > 0) {
        // Idempotent insert: skipDuplicates guards the (userId, startTime,
        // endTime) unique constraint so reconciliation never crashes if a gap's
        // exact slot already exists (e.g. a kept window matched only within the
        // 60s tolerance, or a boundary window just outside the query range).
        await tx.studyWindow.createMany({
          data: newGaps.map((gap) => ({
            userId,
            startTime: gap.start,
            endTime: gap.end,
            durationMin: gap.durationMin,
          })),
          skipDuplicates: true,
        });
      }

      return newGaps.length;
    },
    // 15s covers gap-find + writes plus any time spent waiting on the lock when
    // a sibling regen for the same user is still running.
    { timeout: 15000, maxWait: 10000 }
  );
}

/**
 * Sync all enabled connections for a single user, then regenerate windows once.
 * Event syncs run in parallel (independent per connection); regenerate runs once
 * after all event upserts complete to avoid the race.
 */
export async function syncUser(userId: string) {
  const connections = await prisma.calendarConnection.findMany({
    where: { userId, enabled: true },
    select: { id: true },
  });

  const results = await Promise.allSettled(
    connections.map((c) => syncConnection(c.id))
  );

  let windowsCreated = 0;
  let regenError: string | undefined;
  try {
    windowsCreated = await regenerateWindows(userId);
  } catch (err) {
    regenError = err instanceof Error ? err.message : String(err);
  }

  return {
    windowsCreated,
    regenError,
    connections: results.map((r, i) => ({
      connectionId: connections[i].id,
      ...(r.status === "fulfilled"
        ? r.value
        : { error: String(r.reason), eventsUpserted: 0 }),
    })),
  };
}
