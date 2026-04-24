-- Phase 1a: CRM fields for onboarding + personalization.
-- firstName is required at /register for new signups (enforced in UI); nullable
-- in the DB to allow the 2 pre-existing users to be backfilled out-of-band.

ALTER TABLE "profiles"
  ADD COLUMN "firstName"        TEXT,
  ADD COLUMN "lastName"         TEXT,
  ADD COLUMN "credentialType"   TEXT,
  ADD COLUMN "primaryChallenge" TEXT,
  ADD COLUMN "employerType"     TEXT,
  ADD COLUMN "attribution"      TEXT;
