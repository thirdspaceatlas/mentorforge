import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

const ACTIVE_SUB_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
  "past_due",
  "unpaid",
]);

export type StripeCleanupResult = {
  subscriptionsCanceled: string[];
  customersDeleted: string[];
  customersSkipped: string[];
  errors: string[];
};

/**
 * Cancels MentorForge subscriptions for this user. Deletes Stripe Customer objects
 * only when no other active subscriptions remain on that customer (other apps/products
 * on the same Stripe account are preserved).
 */
export async function cleanupStripeForUser(userId: string): Promise<StripeCleanupResult> {
  const result: StripeCleanupResult = {
    subscriptionsCanceled: [],
    customersDeleted: [],
    customersSkipped: [],
    errors: [],
  };

  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    return result;
  }

  const stripe = getStripe();
  const purchases = await prisma.purchase.findMany({
    where: { userId },
    select: { stripeSessionId: true, stripeSubscriptionId: true },
  });

  const ourSubscriptionIds = new Set(
    purchases.map((p) => p.stripeSubscriptionId).filter((id): id is string => Boolean(id))
  );

  for (const subId of ourSubscriptionIds) {
    try {
      const sub = await stripe.subscriptions.retrieve(subId);
      if (ACTIVE_SUB_STATUSES.has(sub.status)) {
        await stripe.subscriptions.cancel(subId);
        result.subscriptionsCanceled.push(subId);
      }
    } catch (err) {
      result.errors.push(
        `cancel subscription ${subId}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  const customerIds = await collectCustomerIds(stripe, purchases);
  for (const customerId of customerIds) {
    try {
      const subs = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 100,
      });
      const foreignActive = subs.data.some(
        (s) => ACTIVE_SUB_STATUSES.has(s.status) && !ourSubscriptionIds.has(s.id)
      );
      if (foreignActive) {
        result.customersSkipped.push(customerId);
        continue;
      }
      await stripe.customers.del(customerId);
      result.customersDeleted.push(customerId);
    } catch (err) {
      result.errors.push(
        `customer ${customerId}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return result;
}

async function collectCustomerIds(
  stripe: Stripe,
  purchases: { stripeSessionId: string; stripeSubscriptionId: string | null }[]
): Promise<Set<string>> {
  const ids = new Set<string>();

  for (const p of purchases) {
    try {
      const session = await stripe.checkout.sessions.retrieve(p.stripeSessionId);
      const customer = session.customer;
      if (typeof customer === "string") ids.add(customer);
      else if (customer && typeof customer === "object" && "id" in customer) {
        ids.add(customer.id);
      }
    } catch {
      // Session may be old or missing — continue.
    }

    if (p.stripeSubscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(p.stripeSubscriptionId);
        const customer = sub.customer;
        if (typeof customer === "string") ids.add(customer);
        else if (customer && typeof customer === "object" && "id" in customer) {
          ids.add(customer.id);
        }
      } catch {
        // Continue.
      }
    }
  }

  return ids;
}
