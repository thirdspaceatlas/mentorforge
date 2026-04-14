/**
 * Provisions a Y Combinator demo account: Supabase Auth user + paid all_access Purchase row.
 *
 * Requires in .env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (Dashboard → Settings → API → service_role — never expose client-side)
 *   DATABASE_URL (+ DIRECT_URL if your Prisma setup needs it)
 *
 * Optional:
 *   YC_GUEST_EMAIL    (default: yc-reviewer@mentorforge.co)
 *   YC_GUEST_PASSWORD (if unset, a random password is generated and printed once)
 *
 * Usage: npx tsx scripts/create-yc-guest.ts
 */
import { loadEnvConfig } from "@next/env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { getUserPlan } from "@/lib/access";

loadEnvConfig(process.cwd());

const DEFAULT_EMAIL = "yc-reviewer@mentorforge.co";

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) {
    if (name === "SUPABASE_SERVICE_ROLE_KEY") {
      throw new Error(
        `Missing ${name}. Add it from Supabase → Project Settings → API → service_role (secret). ` +
          `Never commit it. Alternatively create the Auth user in the dashboard, then run ` +
          `\`YC_GUEST_EMAIL=... npm run guest:yc:grant\`.`
      );
    }
    throw new Error(`Missing required env: ${name}`);
  }
  return v;
}

function generatePassword(): string {
  const raw = randomBytes(24).toString("base64url");
  return `Yc-${raw}`;
}

async function findAuthUserIdByEmail(
  admin: SupabaseClient,
  email: string
): Promise<string | null> {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error) throw error;
  const lower = email.toLowerCase();
  const u = data.users.find((x) => x.email?.toLowerCase() === lower);
  return u?.id ?? null;
}

async function main() {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRole = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const email = process.env.YC_GUEST_EMAIL?.trim() || DEFAULT_EMAIL;
  const password =
    process.env.YC_GUEST_PASSWORD?.trim() || generatePassword();

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  let userId = await findAuthUserIdByEmail(admin, email);

  if (userId) {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true
    });
    if (error) throw error;
    console.log("Updated existing Auth user password.");
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (error) throw error;
    if (!data.user?.id) throw new Error("createUser returned no user id");
    userId = data.user.id;
    console.log("Created new Auth user.");
  }

  const prisma = new PrismaClient();
  try {
    await prisma.profile.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email
      },
      update: { email }
    });

    const existingAa = await prisma.purchase.findFirst({
      where: {
        userId,
        planKey: "all_access",
        status: "paid"
      }
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
      console.log("Created all_access Purchase row.");
    } else {
      console.log("all_access Purchase already present; skipping insert.");
    }

    const plan = await getUserPlan(userId);
    if (plan.plan !== "all_access") {
      throw new Error(
        `Expected all_access plan, got ${plan.plan}. Check Purchase rows.`
      );
    }

    console.log("\n--- YC demo credentials (store securely; rotate after review) ---");
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log(`User id:  ${userId}`);
    console.log(`Plan:     ${plan.plan} (verified via getUserPlan)`);
    console.log("---\n");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
