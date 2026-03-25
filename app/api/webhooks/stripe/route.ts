import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  console.log("[webhook] POST received — event type will follow");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET");
    console.log("[webhook] early return: STRIPE_WEBHOOK_SECRET missing (500)");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    console.log("[webhook] early return: missing stripe-signature header (400)");
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("Stripe webhook signature verification failed:", message);
    console.log("[webhook] early return: constructEvent failed (400)");
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  console.log("[webhook] event.type:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log(
      "[stripe webhook] checkout.session.completed — session.id:",
      session.id,
      "mode:",
      session.mode
    );
    console.log(
      "[stripe webhook] session.metadata (full):",
      JSON.stringify(session.metadata ?? null, null, 2)
    );

    const userId = session.metadata?.userId;
    console.log("[stripe webhook] userId extracted from metadata:", userId, "(typeof:", typeof userId, ")");

    if (!userId || typeof userId !== "string") {
      console.error("checkout.session.completed missing metadata.userId", session.id);
      console.log(
        "[webhook] early return inside checkout.session.completed: invalid userId — skipping Prisma (200 received: true)"
      );
      return NextResponse.json({ received: true });
    }

    const amountTotal = session.amount_total ?? 0;
    const currency = (session.currency ?? "usd").toLowerCase();
    const status =
      session.payment_status === "paid"
        ? "paid"
        : session.payment_status === "unpaid"
          ? "unpaid"
          : session.payment_status ?? "unknown";

    const planKey = session.metadata?.planKey ?? null;
    console.log("[stripe webhook] planKey extracted from metadata:", planKey);

    const examWindow = session.metadata?.examWindow ?? null;
    const examYearRaw = session.metadata?.examYear;
    const examYear =
      examYearRaw != null && examYearRaw !== "" ? parseInt(examYearRaw, 10) : null;
    const levelUnlocked = session.metadata?.levelUnlocked ?? null;
    const accessExpiresRaw = session.metadata?.accessExpiresAt;

    let accessExpiresAt: Date | null = null;
    if (accessExpiresRaw) {
      accessExpiresAt = new Date(accessExpiresRaw);
    }

    const subscriptionRef = session.subscription;
    const stripeSubscriptionId =
      typeof subscriptionRef === "string"
        ? subscriptionRef
        : subscriptionRef && typeof subscriptionRef === "object" && "id" in subscriptionRef
          ? (subscriptionRef as Stripe.Subscription).id
          : null;

    if (session.mode === "subscription" && stripeSubscriptionId) {
      try {
        const sub = (await getStripe().subscriptions.retrieve(
          stripeSubscriptionId
        )) as Stripe.Subscription & { current_period_end?: number };
        const periodEnd = sub.current_period_end;
        if (periodEnd && typeof periodEnd === "number" && periodEnd > 0) {
          accessExpiresAt = new Date(periodEnd * 1000);
          if (isNaN(accessExpiresAt.getTime())) {
            accessExpiresAt = null;
          }
        }
      } catch (e) {
        console.error("Failed to retrieve subscription for accessExpiresAt", e);
      }
    }

    if (accessExpiresAt !== null && isNaN(accessExpiresAt.getTime())) {
      accessExpiresAt = null;
    }

    const accessExpiresAtForDb =
      accessExpiresAt instanceof Date && !isNaN(accessExpiresAt.getTime()) ? accessExpiresAt : null;

    console.log(
      "[stripe webhook] accessExpiresAt value used for Purchase (after metadata + optional subscription override):",
      accessExpiresAtForDb === null
        ? null
        : accessExpiresAtForDb instanceof Date && !isNaN(accessExpiresAtForDb.getTime())
          ? accessExpiresAtForDb.toISOString()
          : String(accessExpiresAtForDb)
    );

    const createData = {
      userId,
      stripeSessionId: session.id,
      stripeSubscriptionId,
      amountTotal,
      currency,
      status,
      planKey,
      examWindow,
      examYear: Number.isFinite(examYear) ? examYear : null,
      levelUnlocked,
      accessExpiresAt: accessExpiresAtForDb
    };
    console.log(
      "[stripe webhook] Prisma upsert — where:",
      JSON.stringify({ stripeSessionId: session.id }, null, 2)
    );
    console.log("[stripe webhook] Prisma upsert — create branch (exact object):", JSON.stringify(createData, null, 2));

    try {
      await prisma.profile.upsert({
        where: { id: userId },
        create: { id: userId },
        update: {}
      });

      await prisma.purchase.upsert({
        where: { stripeSessionId: session.id },
        create: {
          userId,
          stripeSessionId: session.id,
          stripeSubscriptionId,
          amountTotal,
          currency,
          status,
          planKey,
          examWindow,
          examYear: Number.isFinite(examYear) ? examYear : null,
          levelUnlocked,
          accessExpiresAt: accessExpiresAtForDb
        },
        update: {
          stripeSubscriptionId,
          amountTotal,
          currency,
          status,
          planKey,
          examWindow,
          examYear: Number.isFinite(examYear) ? examYear : null,
          levelUnlocked,
          accessExpiresAt: accessExpiresAtForDb
        }
      });
      console.log("[stripe webhook] prisma.purchase.upsert finished without throw for session:", session.id);
    } catch (e) {
      console.error("[stripe webhook] Prisma upsert caught error (checkout.session.completed):", e);
      if (e instanceof Error) {
        console.error("[stripe webhook] Prisma error name:", e.name);
        console.error("[stripe webhook] Prisma error message:", e.message);
        console.error("[stripe webhook] Prisma error stack:", e.stack);
      }
      console.error("Prisma error recording purchase:", e);
      console.log("[webhook] early return: Prisma upsert failed (500)");
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    const subRef = (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null })
      .subscription;
    const stripeSubscriptionId =
      typeof subRef === "string"
        ? subRef
        : subRef && typeof subRef === "object" && "id" in subRef
          ? (subRef as Stripe.Subscription).id
          : null;

    if (!stripeSubscriptionId) {
      console.log("[webhook] invoice.paid early return: no stripeSubscriptionId on invoice (200)");
      return NextResponse.json({ received: true });
    }

    const purchase = await prisma.purchase.findFirst({
      where: { stripeSubscriptionId }
    });

    if (!purchase) {
      console.log(
        "[webhook] invoice.paid early return: no Purchase row for subscription (200)",
        stripeSubscriptionId
      );
      return NextResponse.json({ received: true });
    }

    const periodEnd = invoice.period_end ? new Date(invoice.period_end * 1000) : null;
    if (periodEnd && purchase.planKey === "all_access") {
      try {
        await prisma.purchase.update({
          where: { id: purchase.id },
          data: {
            accessExpiresAt: periodEnd,
            status: "paid"
          }
        });
      } catch (e) {
        console.error("Prisma error updating purchase on invoice.paid:", e);
        console.log("[webhook] early return: invoice.paid Prisma update failed (500)");
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
    }
  }

  console.log(
    "[webhook] final 200: { received: true } — event.type:",
    event.type,
    "(checkout.session.completed branch may not have run if type differs)"
  );
  return NextResponse.json({ received: true });
}
