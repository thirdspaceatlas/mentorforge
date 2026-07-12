import { prisma } from "@/lib/prisma";
import { regenerateWindows } from "./sync";

/**
 * Device-calendar ingest for the mobile app (expo-calendar). The mobile client
 * reads the device's busy periods and POSTs them here; we store them under a
 * single per-user "device" calendar connection, then run the SAME server-side
 * gap-finder (regenerateWindows) the web OAuth path uses — so windows are
 * identical across platforms.
 *
 * Idempotent: every call replaces the device connection's events, so the mobile
 * app can send its full current busy set each sync.
 */

export const DEVICE_PROVIDER = "device";
const DEVICE_EMAIL = "device";

export type DeviceBusyPeriod = { start: string | Date; end: string | Date };

export async function syncDeviceBusy(
  userId: string,
  busy: DeviceBusyPeriod[],
): Promise<number> {
  const now = new Date();
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 7);

  // One device connection per user. Token fields are placeholders — they are
  // NEVER decrypted (syncConnection short-circuits provider "device").
  const connection = await prisma.calendarConnection.upsert({
    where: {
      userId_provider_providerEmail: {
        userId,
        provider: DEVICE_PROVIDER,
        providerEmail: DEVICE_EMAIL,
      },
    },
    update: { enabled: true },
    create: {
      userId,
      provider: DEVICE_PROVIDER,
      providerEmail: DEVICE_EMAIL,
      accessToken: DEVICE_PROVIDER,
      refreshToken: DEVICE_PROVIDER,
      tokenExpiresAt: new Date(0),
      scopes: DEVICE_PROVIDER,
      enabled: true,
    },
  });

  const normalized = busy
    .map((b) => ({ start: new Date(b.start), end: new Date(b.end) }))
    .filter(
      (b) =>
        !Number.isNaN(b.start.getTime()) &&
        !Number.isNaN(b.end.getTime()) &&
        b.end.getTime() > b.start.getTime() &&
        b.end.getTime() > now.getTime() &&
        b.start.getTime() < horizon.getTime(),
    );

  await prisma.$transaction([
    prisma.calendarEvent.deleteMany({ where: { connectionId: connection.id } }),
    ...(normalized.length > 0
      ? [
          prisma.calendarEvent.createMany({
            data: normalized.map((b, i) => ({
              connectionId: connection.id,
              providerEventId: `device-${b.start.getTime()}-${b.end.getTime()}-${i}`,
              startTime: b.start,
              endTime: b.end,
              busyStatus: "busy",
            })),
          }),
        ]
      : []),
  ]);

  return regenerateWindows(userId);
}
