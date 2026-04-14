/**
 * Grants all_access (Purchase row + profile) for an existing Supabase Auth user.
 * Does not create the Auth user — create them first (Dashboard → Authentication → Users),
 * or use `npm run guest:yc` with SUPABASE_SERVICE_ROLE_KEY.
 *
 * Requires: DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL (unused but loaded for consistency)
 *
 * Usage:
 *   YC_GUEST_EMAIL=you@example.com npx tsx scripts/grant-all-access-by-email.ts
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { getUserPlan } from "@/lib/access";

loadEnvConfig(process.cwd());

async function main() {
  const email = process.env.YC_GUEST_EMAIL?.trim();
  if (!email) {
    throw new Error("Set YC_GUEST_EMAIL to the Auth user’s email.");
  }

  const prisma = new PrismaClient();
  try {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id::text AS id FROM auth.users WHERE email = ${email} LIMIT 1
    `;
    const row = rows[0];
    if (!row) {
      throw new Error(
        `No auth.users row for "${email}". Create the user in Supabase → Authentication first.`
      );
    }
    const userId = row.id;

    await prisma.profile.upsert({
      where: { id: userId },
      create: { id: userId, email },
      update: { email }
    });

    const existingAa = await prisma.purchase.findFirst({
      where: { userId, planKey: "all_access", status: "paid" }
    });

    if (!existingAa) {
      await prisma.purchase.create({
        data: {
          userId,
          stripeSessionId: `cs_manual_yc_guest_${randomBytes(12).toString("hex")}`,
          amountTotal: 0,
          currency: "usd",
          status: "paid",
          planKey: "all_access",
          accessExpiresAt: null
        }
      });
      console.log("Inserted all_access Purchase.");
    } else {
      console.log("all_access Purchase already exists.");
    }

    const plan = await getUserPlan(userId);
    if (plan.plan !== "all_access") {
      throw new Error(`Plan is ${plan.plan}, expected all_access.`);
    }

    console.log(`OK — ${email} has all_access (user id ${userId}).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
