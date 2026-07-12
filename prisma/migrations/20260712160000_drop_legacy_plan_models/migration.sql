-- Drop pre-SavedStudyPlan legacy normalized plan tables (all empty at migration time).
-- Remove orphaned FK column on study_sessions first.

ALTER TABLE "study_sessions" DROP COLUMN IF EXISTS "examTopicDefinitionId";

DROP TABLE IF EXISTS "StudyLog";
DROP TABLE IF EXISTS "PlanItem";
DROP TABLE IF EXISTS "PlanWeek";
DROP TABLE IF EXISTS "StudyPlan";
DROP TABLE IF EXISTS "ExamInstance";
DROP TABLE IF EXISTS "ExamTopicDefinition";
DROP TABLE IF EXISTS "ExamDefinition";
