/**
 * Revoke the YC demo account's access.
 *
 * We did not get into YC, so the reviewer's manually-granted all_access is no
 * longer needed. This deletes ONLY the manual grant(s) (stripeSessionId prefixed
 * `cs_manual_yc_guest_`) for yc-reviewer@mentorforge.co, dropping the account
 * back to the free plan. It does NOT delete the Auth user or their app data, and
 * it never touches real Stripe purchases.
 *
 * Requires: DATABASE_URL
 *
 *   npx tsx scripts/revoke-yc-reviewer.ts           # dry run
 *   npx tsx scripts/revoke-yc-reviewer.ts --execute # apply
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { getUserPlan } from "@/lib/access";

loadEnvConfig(process.cwd());

const YC_EMAIL = "yc-reviewer@mentorforge.co";
const MANUAL_GRANT_PREFIX = "cs_manual_yc_guest_";
const execute = process.argv.includes("--execute");

async function main() {
  const prisma = new PrismaClient();
  try {
    const authRows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id::text AS id FROM auth.users
      WHERE lower(email) = ${YC_EMAIL.toLowerCase()}
      LIMIT 1
    `;
    const userId = authRows[0]?.id;
    if (!userId) {
      console.log(`No auth.users row for ${YC_EMAIL}. Nothing to revoke.`);
      return;
    }

    const grants = await prisma.purchase.findMany({
      where: {
        userId,
        planKey: "all_access",
        stripeSessionId: { startsWith: MANUAL_GRANT_PREFIX },
      },
      select: { id: true, stripeSessionId: true },
    });

    const planBefore = await getUserPlan(userId);
    console.log("Mode:", execute ? "EXECUTE" : "DRY RUN");
    console.log("User:", YC_EMAIL, userId);
    console.log("Plan before:", planBefore.plan);
    console.log(`Manual all_access grants to delete: ${grants.length}`);
    for (const g of grants) console.log("  -", g.stripeSessionId);

    if (grants.length === 0) {
      console.log("No manual grants found; access already revoked.");
      return;
    }

    if (!execute) {
      console.log("\nRe-run with --execute to delete these grants.");
      return;
    }

    const { count } = await prisma.purchase.deleteMany({
      where: { id: { in: grants.map((g) => g.id) } },
    });

    const planAfter = await getUserPlan(userId);
    console.log(`\nDeleted ${count} grant(s). Plan after:`, planAfter.plan);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
