/**
 * Reset YC demo account app data — keeps Auth user, password, and all_access.
 *
 * Does NOT change the Supabase password. Does NOT delete auth.users.
 *
 * Requires: DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL (optional, for logging)
 *
 *   npx tsx scripts/reset-yc-reviewer.ts           # dry run
 *   npx tsx scripts/reset-yc-reviewer.ts --execute # apply
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { getUserPlan } from "@/lib/access";

loadEnvConfig(process.cwd());

const YC_EMAIL = "yc-reviewer@mentorforge.co";
const execute = process.argv.includes("--execute");

async function main() {
  const prisma = new PrismaClient();
  try {
    const authRows = await prisma.$queryRaw<{ id: string; email: string }[]>`
      SELECT id::text AS id, email FROM auth.users
      WHERE lower(email) = ${YC_EMAIL.toLowerCase()}
      LIMIT 1
    `;
    const auth = authRows[0];
    if (!auth) {
      throw new Error(
        `No auth.users row for ${YC_EMAIL}. Create the user in Supabase Auth first.`
      );
    }
    const userId = auth.id;

    const before = {
      savedStudyPlan: await prisma.savedStudyPlan.count({ where: { userId } }),
      calendarConnections: await prisma.calendarConnection.count({ where: { userId } }),
      studyWindows: await prisma.studyWindow.count({ where: { userId } }),
      studySessions: await prisma.studySession.count({ where: { userId } }),
      usageEvents: await prisma.usageEvent.count({ where: { userId } }),
      surveyResponses: await prisma.userSurveyResponse.count({ where: { userId } }),
      pushSubscriptions: await prisma.pushSubscription.count({ where: { userId } }),
      studyPlans: await prisma.studyPlan.count({ where: { userId } }),
      purchases: await prisma.purchase.count({ where: { userId } }),
    };

    console.log("Mode:", execute ? "EXECUTE" : "DRY RUN");
    console.log("User:", YC_EMAIL, userId);
    console.log("Counts before:", before);

    if (!execute) {
      console.log("\nRe-run with --execute to wipe app data (password unchanged).");
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.studySession.deleteMany({ where: { userId } });
      await tx.snoozedWindow.deleteMany({ where: { userId } });
      await tx.studyWindow.deleteMany({ where: { userId } });
      await tx.sessionPattern.deleteMany({ where: { userId } });
      await tx.calendarConnection.deleteMany({ where: { userId } });

      await tx.savedStudyPlan.deleteMany({ where: { userId } });

      await tx.usageEvent.deleteMany({ where: { userId } });
      await tx.userSurveyResponse.deleteMany({ where: { userId } });
      await tx.pushSubscription.deleteMany({ where: { userId } });

      const legacyPlans = await tx.studyPlan.findMany({
        where: { userId },
        select: { id: true },
      });
      for (const plan of legacyPlans) {
        const weeks = await tx.planWeek.findMany({
          where: { studyPlanId: plan.id },
          select: { id: true },
        });
        for (const week of weeks) {
          await tx.planItem.deleteMany({ where: { planWeekId: week.id } });
        }
        await tx.planWeek.deleteMany({ where: { studyPlanId: plan.id } });
        await tx.studyLog.deleteMany({ where: { studyPlanId: plan.id } });
      }
      await tx.studyPlan.deleteMany({ where: { userId } });
      await tx.studyLog.deleteMany({ where: { userId } });
      await tx.examInstance.deleteMany({ where: { userId } });

      await tx.profile.upsert({
        where: { id: userId },
        create: { id: userId, email: YC_EMAIL },
        update: {
          email: YC_EMAIL,
          firstName: null,
          lastName: null,
          credentialType: null,
          primaryChallenge: null,
          employerType: null,
          attribution: null,
          accountDeleteLastAttemptAt: null,
        },
      });

      const existingAa = await tx.purchase.findFirst({
        where: { userId, planKey: "all_access", status: "paid" },
      });
      if (!existingAa) {
        await tx.purchase.create({
          data: {
            userId,
            stripeSessionId: `cs_manual_yc_guest_${randomBytes(12).toString("hex")}`,
            amountTotal: 0,
            currency: "usd",
            status: "paid",
            planKey: "all_access",
            accessExpiresAt: null,
          },
        });
      }
    });

    const plan = await getUserPlan(userId);
    const after = {
      savedStudyPlan: await prisma.savedStudyPlan.count({ where: { userId } }),
      calendarConnections: await prisma.calendarConnection.count({ where: { userId } }),
      studyWindows: await prisma.studyWindow.count({ where: { userId } }),
      purchases: await prisma.purchase.count({ where: { userId, planKey: "all_access" } }),
    };

    console.log("\nDone. Password was NOT changed.");
    console.log("Plan:", plan.plan);
    console.log("Counts after:", after);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
