/**
 * Seeds today's calendar state for a demo account so the new Calendar Coach
 * dashboard (HeroNextSession + DayRibbon + Trends) actually has something to
 * render.
 *
 * What it creates:
 *   - One enabled CalendarConnection (Google) so calendarsConnected > 0.
 *   - Five StudyWindows spanning today: two past (with completed StudySessions
 *     so minutesToday > 0), three future (upcoming).
 *   - Heatmap fill: ~10 days of small completed sessions across the past 14d
 *     so the Trends disclosure shows something.
 *
 * Idempotent: re-running deletes today's seeded windows + sessions + the
 * fake calendar connection for the user, then re-creates them. Real
 * connections (with non-fake providerEmail) are NOT touched.
 *
 * Required env: NEXT_PUBLIC_SUPABASE_URL, DATABASE_URL, CALENDAR_ENCRYPTION_KEY.
 *
 * Usage:
 *   npx tsx scripts/seed-demo-windows.ts                       # default email
 *   npx tsx scripts/seed-demo-windows.ts demo@example.com      # specific email
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { encrypt } from "@/lib/calendar/crypto";

loadEnvConfig(process.cwd());

const DEFAULT_EMAIL = "yc-reviewer@mentorforge.co";
const FAKE_PROVIDER_EMAIL = "demo-seed@mentorforge.local";

type SeedWindow = {
  offsetMinFromNow: number;
  durationMin: number;
  topicName: string;
  studyType: "review" | "new" | "practice";
  done: boolean;
};

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function withinTodayWindow(start: Date, durationMin: number): boolean {
  const end = new Date(start.getTime() + durationMin * 60_000);
  const today = startOfToday();
  const tomorrow = endOfToday();
  return start >= today && end <= tomorrow;
}

async function main() {
  const email = (process.argv[2] ?? DEFAULT_EMAIL).trim();

  const prisma = new PrismaClient();
  try {
    const profile = await prisma.profile.findFirst({ where: { email } });
    if (!profile) {
      console.error(
        `No Profile row found for ${email}. ` +
          `Run \`npm run guest:yc\` first (or pass an existing user's email).`
      );
      process.exit(1);
    }
    const userId = profile.id;
    console.log(`Seeding demo data for user ${userId} (${email})…`);

    const today = startOfToday();
    const tomorrow = endOfToday();
    const now = new Date();

    // 1. Calendar connection (fake — no real OAuth, just satisfies the count).
    await prisma.calendarConnection.deleteMany({
      where: { userId, providerEmail: FAKE_PROVIDER_EMAIL },
    });
    await prisma.calendarConnection.create({
      data: {
        userId,
        provider: "google",
        providerEmail: FAKE_PROVIDER_EMAIL,
        accessToken: encrypt("demo-access-token"),
        refreshToken: encrypt("demo-refresh-token"),
        tokenExpiresAt: new Date(now.getTime() + 60 * 60_000),
        scopes:
          "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events",
        enabled: true,
      },
    });
    console.log("  ✓ CalendarConnection (fake demo) ensured.");

    // 2. Wipe today's windows + their sessions for this user.
    const oldWindows = await prisma.studyWindow.findMany({
      where: { userId, startTime: { gte: today, lte: tomorrow } },
      select: { id: true },
    });
    if (oldWindows.length) {
      const ids = oldWindows.map((w) => w.id);
      await prisma.studySession.deleteMany({ where: { windowId: { in: ids } } });
      await prisma.studyWindow.deleteMany({ where: { id: { in: ids } } });
      console.log(`  ✓ Cleared ${oldWindows.length} existing windows for today.`);
    }

    // 3. Build today's window plan relative to "now".
    const plan: SeedWindow[] = [
      { offsetMinFromNow: -180, durationMin: 45, topicName: "Probability Distributions", studyType: "review", done: true },
      { offsetMinFromNow: -90, durationMin: 30, topicName: "Standard III · Duties", studyType: "review", done: true },
      { offsetMinFromNow: 30, durationMin: 45, topicName: "Reading 23 · DCF practice", studyType: "new", done: false },
      { offsetMinFromNow: 180, durationMin: 30, topicName: "Pensions & PP/E", studyType: "practice", done: false },
      { offsetMinFromNow: 360, durationMin: 30, topicName: "25 flashcards", studyType: "review", done: false },
    ];

    let created = 0;
    let skipped = 0;
    for (const w of plan) {
      const startTime = new Date(now.getTime() + w.offsetMinFromNow * 60_000);
      if (!withinTodayWindow(startTime, w.durationMin)) {
        skipped++;
        continue;
      }
      const endTime = new Date(startTime.getTime() + w.durationMin * 60_000);
      const window = await prisma.studyWindow.create({
        data: {
          userId,
          startTime,
          endTime,
          durationMin: w.durationMin,
          topicName: w.topicName,
          studyType: w.studyType,
        },
      });

      if (w.done) {
        await prisma.studySession.create({
          data: {
            userId,
            windowId: window.id,
            startedAt: startTime,
            completedAt: endTime,
            actualMin: w.durationMin,
            plannedDurationMin: w.durationMin,
            interrupted: false,
          },
        });
      }
      created++;
    }
    console.log(
      `  ✓ Created ${created} StudyWindows for today` +
        (skipped ? ` (${skipped} skipped — outside today's range).` : ".")
    );

    // 4. Heatmap fill — past 13 days, one window+session per non-zero day.
    //    Tagged with topicName "Demo backfill" so re-runs can clean themselves up
    //    without sweeping real history.
    const fourteenAgo = new Date(today);
    fourteenAgo.setDate(fourteenAgo.getDate() - 13);
    const backfillOld = await prisma.studyWindow.findMany({
      where: { userId, topicName: "Demo backfill" },
      select: { id: true },
    });
    if (backfillOld.length) {
      const ids = backfillOld.map((w) => w.id);
      await prisma.studySession.deleteMany({ where: { windowId: { in: ids } } });
      await prisma.studyWindow.deleteMany({ where: { id: { in: ids } } });
    }
    const minutesPattern = [60, 90, 45, 0, 75, 120, 30, 90, 60, 0, 45, 105, 90];
    let backfillCreated = 0;
    for (let i = 0; i < minutesPattern.length; i++) {
      const m = minutesPattern[i];
      if (m === 0) continue;
      const day = new Date(fourteenAgo);
      day.setDate(day.getDate() + i);
      day.setHours(9, 0, 0, 0);
      const dayEnd = new Date(day.getTime() + m * 60_000);
      const w = await prisma.studyWindow.create({
        data: {
          userId,
          startTime: day,
          endTime: dayEnd,
          durationMin: m,
          topicName: "Demo backfill",
          studyType: "review",
        },
      });
      await prisma.studySession.create({
        data: {
          userId,
          windowId: w.id,
          startedAt: day,
          completedAt: dayEnd,
          actualMin: m,
          plannedDurationMin: m,
          interrupted: false,
        },
      });
      backfillCreated++;
    }
    console.log(`  ✓ Heatmap backfill — ${backfillCreated} of last 13 days seeded.`);

    console.log(
      `\nDone. Sign in as ${email} and visit http://localhost:3000/app to see the new dashboard.`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
