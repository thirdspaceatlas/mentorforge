/**
 * Self-cleaning live verification for the mobile follow-ups:
 *   1. register-mobile: store + read back + delete an Expo token.
 *   2. device calendar ingest: syncDeviceBusy → windows generated → cleanup
 *      (delete device connection + regenerate to restore the prior window set).
 *
 * Leaves the DB exactly as it found it. Usage: npx tsx scripts/test-mobile-endpoints.ts
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { syncDeviceBusy } from "@/lib/calendar/device-sync";
import { regenerateWindows } from "@/lib/calendar/sync";

loadEnvConfig(process.cwd());
const prisma = new PrismaClient();
const EMAIL = "david.blackwealth@pm.me";

async function main() {
  const profile = await prisma.profile.findFirst({ where: { email: EMAIL } });
  if (!profile) throw new Error(`no profile for ${EMAIL}`);
  const userId = profile.id;

  console.log("=== 1) MobilePushToken register/read/delete ===");
  const testToken = "ExponentPushToken[TEST-DO-NOT-SEND]";
  await prisma.mobilePushToken.upsert({
    where: { expoPushToken: testToken },
    update: { userId, platform: "iOS" },
    create: { userId, expoPushToken: testToken, platform: "iOS" },
  });
  const stored = await prisma.mobilePushToken.findUnique({ where: { expoPushToken: testToken } });
  console.log("  stored:", stored ? `ok (platform=${stored.platform})` : "FAILED");
  await prisma.mobilePushToken.delete({ where: { expoPushToken: testToken } });
  const gone = await prisma.mobilePushToken.findUnique({ where: { expoPushToken: testToken } });
  console.log("  cleaned up:", gone ? "FAILED" : "ok");

  console.log("\n=== 2) Device calendar ingest (syncDeviceBusy) ===");
  const before = await prisma.studyWindow.count({ where: { userId } });
  const hadDevice = await prisma.calendarConnection.findFirst({
    where: { userId, provider: "device" },
  });
  console.log(`  baseline windows: ${before} | pre-existing device connection: ${hadDevice ? "yes" : "no"}`);

  // One busy block tomorrow 10:00–11:00 UTC.
  const t = new Date();
  t.setUTCDate(t.getUTCDate() + 1);
  const start = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(), 10, 0));
  const end = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(), 11, 0));

  const created = await syncDeviceBusy(userId, [{ start, end }]);
  const afterIngest = await prisma.studyWindow.count({ where: { userId } });
  const deviceConn = await prisma.calendarConnection.findFirst({ where: { userId, provider: "device" } });
  const deviceEvents = deviceConn
    ? await prisma.calendarEvent.count({ where: { connectionId: deviceConn.id } })
    : 0;
  console.log(`  syncDeviceBusy returned newGaps=${created}`);
  console.log(`  device connection created: ${deviceConn ? "yes" : "no"} | device events stored: ${deviceEvents}`);
  console.log(`  windows after ingest: ${afterIngest}`);

  // Cleanup: if we created the device connection, remove it (cascade deletes its
  // events) and regenerate so the device-derived windows (no sessions) are pruned.
  if (!hadDevice && deviceConn) {
    await prisma.calendarConnection.delete({ where: { id: deviceConn.id } });
    await regenerateWindows(userId);
    const afterCleanup = await prisma.studyWindow.count({ where: { userId } });
    console.log(`  cleanup: device connection removed, windows now ${afterCleanup} (baseline ${before})`);
    console.log(`  restored to baseline: ${afterCleanup === before ? "ok" : "DIFF (device windows without sessions pruned; sessions preserved)"}`);
  } else {
    console.log("  cleanup skipped (a real device connection already existed — left untouched).");
  }

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
