/**
 * One-time cleanup: keep the 6 Supabase Auth users, merge duplicate david@mentorforge.co
 * profiles into the live Auth user, delete orphan profiles, rename David's email.
 *
 * Requires: DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 *   npx tsx scripts/cleanup-database-users.ts           # dry run
 *   npx tsx scripts/cleanup-database-users.ts --execute # apply
 */
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());

const KEEP_AUTH_EMAILS = [
  "cyoops971031@gmail.com",
  "david@mentorforge.co",
  "gmaalouf10@gmail.com",
  "mchanganyikomaalum@gmail.com",
  "saebaus2@gmail.com",
  "yc-reviewer@mentorforge.co",
] as const;

const DAVID_NEW_EMAIL = "david@thirdspaceatlas.com";
const DAVID_OLD_EMAIL = "david@mentorforge.co";

const execute = process.argv.includes("--execute");

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

async function main() {
  const prisma = new PrismaClient();
  const admin = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  try {
    const authRows = await prisma.$queryRaw<{ id: string; email: string }[]>`
      SELECT id::text AS id, email FROM auth.users ORDER BY email
    `;

    const keepIds = new Set<string>();
    let davidAuthId: string | null = null;

    for (const row of authRows) {
      const email = row.email?.toLowerCase() ?? "";
      if (!KEEP_AUTH_EMAILS.some((k) => k.toLowerCase() === email)) {
        console.warn(`Unexpected auth.users row (not in keep list): ${row.email} ${row.id}`);
        continue;
      }
      keepIds.add(row.id);
      if (email === DAVID_OLD_EMAIL.toLowerCase()) davidAuthId = row.id;
    }

    if (keepIds.size !== 6) {
      throw new Error(`Expected 6 auth users, found ${keepIds.size}. Aborting.`);
    }
    if (!davidAuthId) {
      throw new Error(`No auth.users row for ${DAVID_OLD_EMAIL}`);
    }

    const existingNew = await prisma.$queryRaw<{ c: bigint }[]>`
      SELECT count(*)::bigint AS c FROM auth.users
      WHERE lower(email) = ${DAVID_NEW_EMAIL.toLowerCase()}
    `;
    if (existingNew[0] && existingNew[0].c > 0n) {
      throw new Error(`${DAVID_NEW_EMAIL} already exists in auth.users`);
    }

    const davidDuplicates = await prisma.profile.findMany({
      where: {
        email: { equals: DAVID_OLD_EMAIL, mode: "insensitive" },
        id: { not: davidAuthId },
      },
      include: {
        savedStudyPlan: true,
        _count: { select: { studyWindows: true, calendarConnections: true } },
      },
    });

    const canonicalPlan = await prisma.savedStudyPlan.findUnique({
      where: { userId: davidAuthId },
    });

    let bestPlan = canonicalPlan;
    for (const dup of davidDuplicates) {
      const p = dup.savedStudyPlan;
      if (!p) continue;
      if (!bestPlan) {
        bestPlan = p;
        continue;
      }
      const a = Array.isArray(p.weekPlan) ? (p.weekPlan as unknown[]).length : 0;
      const b = Array.isArray(bestPlan.weekPlan)
        ? (bestPlan.weekPlan as unknown[]).length
        : 0;
      if (a > b || p.updatedAt > bestPlan.updatedAt) bestPlan = p;
    }

    const orphanIds = (
      await prisma.profile.findMany({
        where: { id: { notIn: [...keepIds] } },
        select: { id: true, email: true },
      })
    ).map((p) => p.id);

    const dupIds = davidDuplicates.map((d) => d.id);

    console.log("Mode:", execute ? "EXECUTE" : "DRY RUN");
    console.log("Keep auth/profile ids:", [...keepIds].sort());
    console.log("David canonical id:", davidAuthId);
    console.log("David duplicate profile ids to merge then remove:", dupIds);
    console.log("Orphan profile ids to delete:", orphanIds.length, orphanIds.slice(0, 5), "…");
    console.log("Email change:", DAVID_OLD_EMAIL, "→", DAVID_NEW_EMAIL);

    if (!execute) {
      console.log("\nRe-run with --execute to apply.");
      return;
    }

    // Merge best study plan onto canonical David
    if (bestPlan && bestPlan.userId !== davidAuthId) {
      const {
        examLevel,
        examDate,
        weeklyHours,
        planStartDate,
        weekStartDay,
        levelIIIPathway,
        forecastDays,
        calendarPreferredSessionMin,
        dayStartHour,
        dayEndHour,
        weekPlan,
        baseWeekPlan,
        actualHours,
      } = bestPlan;
      await prisma.savedStudyPlan.upsert({
        where: { userId: davidAuthId },
        create: {
          userId: davidAuthId,
          examLevel,
          examDate,
          weeklyHours,
          planStartDate,
          weekStartDay,
          levelIIIPathway,
          forecastDays,
          calendarPreferredSessionMin,
          dayStartHour,
          dayEndHour,
          weekPlan,
          baseWeekPlan,
          actualHours,
        },
        update: {
          examLevel,
          examDate,
          weeklyHours,
          planStartDate,
          weekStartDay,
          levelIIIPathway,
          forecastDays,
          calendarPreferredSessionMin,
          dayStartHour,
          dayEndHour,
          weekPlan,
          baseWeekPlan,
          actualHours,
        },
      });
      console.log("Upserted best SavedStudyPlan onto canonical David.");
    }

    const reassignFrom = [...dupIds];
    if (reassignFrom.length > 0) {
      const tables: Array<{ name: string; run: () => Promise<{ count: number }> }> = [
        {
          name: "calendar_connections",
          run: () =>
            prisma.calendarConnection.updateMany({
              where: { userId: { in: reassignFrom } },
              data: { userId: davidAuthId },
            }),
        },
        {
          // Duplicate David accounts often share identical windows; unique (userId, start, end) blocks reassignment.
          name: "study_windows (delete on dup profiles)",
          run: () =>
            prisma.studyWindow.deleteMany({
              where: { userId: { in: reassignFrom } },
            }),
        },
        {
          name: "study_sessions",
          run: () =>
            prisma.studySession.updateMany({
              where: { userId: { in: reassignFrom } },
              data: { userId: davidAuthId },
            }),
        },
        {
          name: "push_subscriptions",
          run: () =>
            prisma.pushSubscription.updateMany({
              where: { userId: { in: reassignFrom } },
              data: { userId: davidAuthId },
            }),
        },
        {
          name: "usage_events",
          run: () =>
            prisma.usageEvent.updateMany({
              where: { userId: { in: reassignFrom } },
              data: { userId: davidAuthId },
            }),
        },
        {
          name: "snoozed_windows",
          run: () =>
            prisma.snoozedWindow.updateMany({
              where: { userId: { in: reassignFrom } },
              data: { userId: davidAuthId },
            }),
        },
        {
          name: "session_patterns",
          run: () =>
            prisma.sessionPattern.updateMany({
              where: { userId: { in: reassignFrom } },
              data: { userId: davidAuthId },
            }),
        },
        {
          name: "purchases",
          run: () =>
            prisma.purchase.updateMany({
              where: { userId: { in: reassignFrom } },
              data: { userId: davidAuthId },
            }),
        },
        {
          name: "user_survey_responses",
          run: () =>
            prisma.userSurveyResponse.updateMany({
              where: { userId: { in: reassignFrom } },
              data: { userId: davidAuthId },
            }),
        },
      ];
      for (const t of tables) {
        const r = await t.run();
        if (r.count > 0) console.log(`Reassigned ${r.count} ${t.name} → David canonical`);
      }
    }

    if (orphanIds.length > 0) {
      const deleted = await prisma.profile.deleteMany({
        where: { id: { in: orphanIds } },
      });
      console.log(`Deleted ${deleted.count} orphan profiles (cascade).`);
    }

    const { error: authErr } = await admin.auth.admin.updateUserById(davidAuthId, {
      email: DAVID_NEW_EMAIL,
      email_confirm: true,
    });
    if (authErr) throw authErr;

    await prisma.profile.update({
      where: { id: davidAuthId },
      data: { email: DAVID_NEW_EMAIL },
    });

    console.log(`Auth + profile email updated to ${DAVID_NEW_EMAIL}`);

    const after = {
      profiles: await prisma.profile.count(),
      auth: await prisma.$queryRaw<{ c: bigint }[]>`
        SELECT count(*)::bigint AS c FROM auth.users
      `,
    };
    console.log("After cleanup:", after);
    console.log("OK");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
