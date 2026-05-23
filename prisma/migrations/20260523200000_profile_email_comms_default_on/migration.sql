-- FORGE-19: default the weekly digest opt-in to ON, and flip existing users on.
-- Decision 2026-05-23 — the digest may be the one thing that re-activates a dormant
-- user; one-click unsubscribe remains via /api/email/unsubscribe.
--
-- NOTE: the UPDATE flips EVERYONE currently false, including anyone who previously
-- unsubscribed. Authorized at current scale ("flip everyone, see what happens").

ALTER TABLE "profiles"
  ALTER COLUMN "emailCommunicationsOptIn" SET DEFAULT true;

UPDATE "profiles"
  SET "emailCommunicationsOptIn" = true
  WHERE "emailCommunicationsOptIn" = false;
