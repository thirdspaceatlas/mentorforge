/**
 * Sends a REAL test push notification to a user's subscribed device(s).
 * Only sends to devices already stored in push_subscriptions (i.e. the user
 * must have toggled Notifications ON in the app first).
 *
 * Usage:
 *   npx tsx scripts/send-test-notification.ts                      # default email
 *   npx tsx scripts/send-test-notification.ts someone@example.com  # specific email
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { sendPush, isSubscriptionGone } from "@/lib/push/vapid";
import { sendExpoPush } from "@/lib/push/expo";

loadEnvConfig(process.cwd());

const DEFAULT_EMAIL = "david.blackwealth@pm.me";
const prisma = new PrismaClient();

async function main() {
  const email = (process.argv[2] ?? DEFAULT_EMAIL).trim();

  const profile = await prisma.profile.findFirst({ where: { email } });
  if (!profile) {
    console.error(`No Profile found for ${email}.`);
    return;
  }

  const subs = await prisma.pushSubscription.findMany({ where: { userId: profile.id } });
  const mobileTokens = await prisma.mobilePushToken.findMany({ where: { userId: profile.id } });
  console.log(`User ${email}: ${subs.length} web device(s), ${mobileTokens.length} mobile device(s).`);
  if (subs.length === 0 && mobileTokens.length === 0) {
    console.log(
      `\n→ No devices subscribed yet.\n` +
        `  Web:    Account → Notifications → toggle ON (click Allow).\n` +
        `  Mobile: open the app so it registers its Expo push token.\n` +
        `  Then re-run.`
    );
    return;
  }

  const payload = {
    title: "MentorForge — test nudge",
    body: "If you can see this, push notifications are working. 25-min window is open — Review Financial Reporting and Analysis, or open your own materials.",
    url: "/app/today",
    tag: "mentorforge-test",
    actions: [
      { action: "micro-dose", title: "25-min: FRA" },
      { action: "open-materials", title: "Open my materials" },
    ],
  };

  let delivered = 0;
  let removed = 0;

  // Web push (VAPID)
  for (const sub of subs) {
    const ua = sub.userAgent ?? "unknown device";
    try {
      await sendPush({ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth }, payload);
      delivered++;
      console.log(`  ✓ [web] delivered to ${ua}`);
    } catch (err) {
      if (isSubscriptionGone(err)) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        removed++;
        console.log(`  ✗ [web] ${ua}: subscription gone (410/404) — removed stale row`);
      } else {
        console.log(`  ✗ [web] ${ua}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  // Native push (Expo)
  if (mobileTokens.length > 0) {
    const results = await sendExpoPush(
      mobileTokens.map((t) => t.expoPushToken),
      { title: payload.title, body: payload.body, url: payload.url, data: { tag: payload.tag } }
    );
    for (const r of results) {
      if (r.ok) {
        delivered++;
        console.log(`  ✓ [mobile] delivered to ${r.token.slice(0, 24)}…`);
      } else if (r.removable) {
        await prisma.mobilePushToken.deleteMany({ where: { expoPushToken: r.token } }).catch(() => {});
        removed++;
        console.log(`  ✗ [mobile] ${r.token.slice(0, 24)}…: DeviceNotRegistered — removed`);
      } else {
        console.log(`  ✗ [mobile] ${r.token.slice(0, 24)}…: ${r.error}`);
      }
    }
  }

  console.log(`\nDone. delivered=${delivered} removedStale=${removed}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
