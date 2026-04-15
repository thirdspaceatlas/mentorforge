-- AlterTable
ALTER TABLE "saved_study_plans" ADD COLUMN "calendarPreferredSessionMin" INTEGER NOT NULL DEFAULT 45;

-- AlterTable
ALTER TABLE "study_sessions" ADD COLUMN "plannedDurationMin" INTEGER;
