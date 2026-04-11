import { prisma } from "@/lib/prisma";
import { getValidAccessToken, OAuthRevokedError } from "./token-refresh";
import { fetchGoogleEvents, fetchOutlookEvents, toBusyPeriods } from "./providers";
import type { ProviderEvent } from "./providers";
import { findGaps } from "./gap-finder";

/**
 * Sync a single calendar connection:
 * 1. Refresh token if needed
 * 2. Fetch events from provider (next 7 days)
 * 3. Upsert CalendarEvent rows
 * 4. Run gap finder across all user connections
 * 5. Upsert StudyWindow rows (detect new gaps for notifications)
 *
 * Returns the number of new windows created.
 */
export async function syncConnection(connectionId: string): Promise<{
  eventsUpserted: number;
  windowsCreated: number;
  error?: string;
}> {
  const connection = await prisma.calendarConnection.findUniqueOrThrow({
    where: { id: connectionId },
  });

  if (!connection.enabled) {
    return { eventsUpserted: 0, windowsCreated: 0 };
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
      return { eventsUpserted: 0, windowsCreated: 0, error: err.message };
    }
    throw err;
  }

  // Fetch next 7 days of events
  const timeMin = new Date();
  const timeMax = new Date();
  timeMax.setDate(timeMax.getDate() + 7);

  let events: ProviderEvent[];
  if (connection.provider === "google") {
    events = await fetchGoogleEvents(accessToken, timeMin, timeMax);
  } else if (connection.provider === "outlook") {
    events = await fetchOutlookEvents(accessToken, timeMin, timeMax);
  } else {
    return { eventsUpserted: 0, windowsCreated: 0, error: `Unknown provider: ${connection.provider}` };
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

  // Now run gap finder across ALL of this user's connections (unified timeline)
  const windowsCreated = await regenerateWindows(connection.userId);

  return { eventsUpserted, windowsCreated };
}

/**
 * Regenerate study windows for a user from all their calendar events.
 * This is called after syncing any single connection.
 *
 * Strategy:
 * 1. Gather all busy periods from all enabled connections (next 7 days)
 * 2. Run gap finder
 * 3. Compare with existing windows
 * 4. Create new windows, mark expired ones
 */
async function regenerateWindows(userId: string): Promise<number> {
  const now = new Date();
  const sevenDaysOut = new Date();
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);

  // Get all events across all enabled connections
  const allEvents = await prisma.calendarEvent.findMany({
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

  // TODO: Load user preferences for dayStartHour, dayEndHour
  const gaps = findGaps(now, sevenDaysOut, busyPeriods, {
    minSessionMin: 15,
    maxSessionMin: 120,
    dayStartHour: 7,
    dayEndHour: 22,
  });

  // Get existing windows to avoid duplicates
  const existingWindows = await prisma.studyWindow.findMany({
    where: {
      userId,
      startTime: { gte: now },
      endTime: { lte: sevenDaysOut },
    },
    select: { id: true, startTime: true, endTime: true },
  });

  // Simple dedup: a gap matches an existing window if start/end are within 1 minute
  const isMatch = (gap: { start: Date; end: Date }, win: { startTime: Date; endTime: Date }) => {
    const startDiff = Math.abs(gap.start.getTime() - win.startTime.getTime());
    const endDiff = Math.abs(gap.end.getTime() - win.endTime.getTime());
    return startDiff < 60000 && endDiff < 60000;
  };

  let created = 0;

  for (const gap of gaps) {
    const alreadyExists = existingWindows.some((w) => isMatch(gap, w));
    if (!alreadyExists) {
      await prisma.studyWindow.create({
        data: {
          userId,
          startTime: gap.start,
          endTime: gap.end,
          durationMin: gap.durationMin,
          // TODO: Run topic recommender to fill topicName + studyType
        },
      });
      created++;
    }
  }

  return created;
}

/**
 * Sync all enabled connections for a single user.
 */
export async function syncUser(userId: string) {
  const connections = await prisma.calendarConnection.findMany({
    where: { userId, enabled: true },
    select: { id: true },
  });

  const results = await Promise.allSettled(
    connections.map((c) => syncConnection(c.id))
  );

  return results.map((r, i) => ({
    connectionId: connections[i].id,
    ...(r.status === "fulfilled" ? r.value : { error: String(r.reason), eventsUpserted: 0, windowsCreated: 0 }),
  }));
}
