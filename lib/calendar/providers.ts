import type { BusyPeriod } from "./gap-finder";

/**
 * Provider-specific calendar event fetching.
 * Returns only busy/free periods — never event titles, descriptions, or attendees.
 */

export type ProviderEvent = {
  providerEventId: string;
  start: Date;
  end: Date;
  busyStatus: "busy" | "free" | "tentative";
};

/**
 * Fetch free/busy data from Google Calendar.
 * Uses the freebusy API — only returns time ranges, not event details.
 */
export async function fetchGoogleEvents(
  accessToken: string,
  timeMin: Date,
  timeMax: Date,
  calendarId = "primary"
): Promise<ProviderEvent[]> {
  const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: calendarId }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new ProviderParseError(`Google freeBusy failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  const busySlots = data.calendars?.[calendarId]?.busy ?? [];

  return busySlots.map((slot: { start: string; end: string }, i: number) => ({
    providerEventId: `google-busy-${slot.start}-${i}`,
    start: new Date(slot.start),
    end: new Date(slot.end),
    busyStatus: "busy" as const,
  }));
}

/**
 * Fetch calendar events from Outlook via Microsoft Graph.
 * Uses calendarView which returns time-windowed events.
 * We only extract start/end/showAs — never subject, body, or attendees.
 */
export async function fetchOutlookEvents(
  accessToken: string,
  timeMin: Date,
  timeMax: Date
): Promise<ProviderEvent[]> {
  const params = new URLSearchParams({
    startDateTime: timeMin.toISOString(),
    endDateTime: timeMax.toISOString(),
    $select: "id,start,end,showAs",
    $top: "250",
    $orderby: "start/dateTime",
  });

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendarView?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new ProviderParseError(`Outlook calendarView failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  const events: ProviderEvent[] = [];

  for (const ev of data.value ?? []) {
    const busyMap: Record<string, "busy" | "free" | "tentative"> = {
      busy: "busy",
      oof: "busy",           // out of office = busy
      workingElsewhere: "busy",
      tentative: "tentative",
      free: "free",
      unknown: "busy",       // default to busy for safety
    };

    events.push({
      providerEventId: ev.id,
      start: new Date(ev.start.dateTime + "Z"), // Graph returns UTC without Z suffix
      end: new Date(ev.end.dateTime + "Z"),
      busyStatus: busyMap[ev.showAs] ?? "busy",
    });
  }

  return events;
}

/**
 * Convert provider events to busy periods for the gap finder.
 * Filters out "free" events (only busy/tentative block study time).
 */
export function toBusyPeriods(events: ProviderEvent[]): BusyPeriod[] {
  return events
    .filter((e) => e.busyStatus !== "free")
    .map((e) => ({ start: e.start, end: e.end }));
}

export class ProviderParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderParseError";
  }
}
