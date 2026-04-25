-- User-configurable working hours for Calendar Coach.
-- Replaces hardcoded 7am-10pm constants in lib/calendar/sync.ts.

ALTER TABLE "saved_study_plans"
  ADD COLUMN "dayStartHour" INTEGER NOT NULL DEFAULT 7,
  ADD COLUMN "dayEndHour"   INTEGER NOT NULL DEFAULT 22;
