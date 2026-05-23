-- Email communications opt-in + account-delete rate limit on profiles.
ALTER TABLE "profiles"
  ADD COLUMN IF NOT EXISTS "emailCommunicationsOptIn" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "accountDeleteLastAttemptAt" TIMESTAMP(3);
