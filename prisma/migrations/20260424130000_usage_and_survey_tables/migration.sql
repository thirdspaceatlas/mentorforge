-- Phase 1b: usage metering + research pool.
-- usage_events        — records capped actions (rebalance, nudge_sent, ...) for rolling-7-day counts.
-- user_survey_responses — stores answers to rotating in-digest / in-app research questions.

CREATE TABLE "usage_events" (
  "id"        TEXT NOT NULL,
  "userId"    UUID NOT NULL,
  "action"    TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "usage_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "usage_events_userId_action_createdAt_idx"
  ON "usage_events" ("userId", "action", "createdAt");

ALTER TABLE "usage_events"
  ADD CONSTRAINT "usage_events_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "user_survey_responses" (
  "id"         TEXT NOT NULL,
  "userId"     UUID NOT NULL,
  "question"   TEXT NOT NULL,
  "answer"     TEXT NOT NULL,
  "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_survey_responses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_survey_responses_userId_question_idx"
  ON "user_survey_responses" ("userId", "question");

ALTER TABLE "user_survey_responses"
  ADD CONSTRAINT "user_survey_responses_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: these are per-user rows; matches pattern from 20260415180000_enable_rls_public_tables.
ALTER TABLE "usage_events"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_survey_responses" ENABLE ROW LEVEL SECURITY;
