-- Drop legacy normalized study plan tables (superseded by saved_study_plans).
-- Safe when tables were already removed manually or in a prior deploy.

DROP TABLE IF EXISTS "StudyLog";
DROP TABLE IF EXISTS "PlanItem";
DROP TABLE IF EXISTS "PlanWeek";
DROP TABLE IF EXISTS "StudyPlan";

-- Index for cron notify query: notified = false AND startTime in window.
CREATE INDEX IF NOT EXISTS "study_windows_notified_startTime_idx" ON "study_windows"("notified", "startTime");
