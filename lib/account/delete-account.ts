import { prisma } from "@/lib/prisma";
import { revokeCalendarOAuthTokens } from "@/lib/calendar/revoke-oauth";
import { cleanupStripeForUser } from "@/lib/account/stripe-cleanup";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const DELETE_ATTEMPT_COOLDOWN_MS = 60_000;

export class AccountDeleteRateLimitError extends Error {
  constructor() {
    super("Please wait before trying again.");
    this.name = "AccountDeleteRateLimitError";
  }
}

export class AccountDeleteConfirmError extends Error {
  constructor() {
    super('Confirmation must be exactly "delete".');
    this.name = "AccountDeleteConfirmError";
  }
}

/** Records a delete attempt timestamp (call before validation to rate-limit abuse). */
export async function touchAccountDeleteAttempt(userId: string): Promise<void> {
  await prisma.profile.update({
    where: { id: userId },
    data: { accountDeleteLastAttemptAt: new Date() },
  });
}

export async function assertAccountDeleteRateLimit(userId: string): Promise<void> {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { accountDeleteLastAttemptAt: true },
  });
  if (!profile?.accountDeleteLastAttemptAt) return;

  const elapsed = Date.now() - profile.accountDeleteLastAttemptAt.getTime();
  if (elapsed < DELETE_ATTEMPT_COOLDOWN_MS) {
    throw new AccountDeleteRateLimitError();
  }
}

export function assertDeleteConfirmation(confirm: string): void {
  if (confirm !== "delete") {
    throw new AccountDeleteConfirmError();
  }
}

export type DeleteAccountResult = {
  stripe: Awaited<ReturnType<typeof cleanupStripeForUser>>;
};

/**
 * Permanently deletes the user's app data and Supabase Auth account.
 * Order: Stripe cleanup → revoke calendar tokens → profile (cascades) → auth.users.
 */
export async function deleteUserAccount(userId: string): Promise<DeleteAccountResult> {
  const stripe = await cleanupStripeForUser(userId);
  await revokeCalendarOAuthTokens(userId);

  await prisma.profile.delete({ where: { id: userId } });

  const admin = getSupabaseAdmin();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    throw new Error(`Auth user deletion failed: ${error.message}`);
  }

  return { stripe };
}
