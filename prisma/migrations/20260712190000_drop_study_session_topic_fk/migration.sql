-- Align Prisma schema with production: examTopicDefinitionId was removed from study_sessions
-- when legacy normalized plan tables were dropped. Safe no-op if already absent.

ALTER TABLE "study_sessions" DROP COLUMN IF EXISTS "examTopicDefinitionId";
