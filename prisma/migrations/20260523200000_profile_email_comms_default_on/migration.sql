-- FORGE-19: default the weekly digest opt-in to ON for NEW users, and add an
-- opt-out audit column so explicit unsubscribes are never silently reversed.
--
-- Consent-safe (revised): we do NOT retroactively flip existing users. A bare
-- boolean can't distinguish "never chose" from "explicitly unsubscribed", and
-- re-subscribing an opt-out is a consent violation (CAN-SPAM/GDPR). New users
-- get default ON; existing users keep whatever they had. From now on, an
-- unsubscribe stamps emailOptOutAt so future backfills can respect it.

ALTER TABLE "profiles"
  ALTER COLUMN "emailCommunicationsOptIn" SET DEFAULT true;

ALTER TABLE "profiles"
  ADD COLUMN IF NOT EXISTS "emailOptOutAt" TIMESTAMP(3);
