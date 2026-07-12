-- Additive: cache Home-screen insight blurbs on the saved study plan.

ALTER TABLE "saved_study_plans" ADD COLUMN     "insightReadiness" TEXT,
ADD COLUMN     "insightCoachTip" TEXT,
ADD COLUMN     "insightSignature" TEXT,
ADD COLUMN     "insightGeneratedAt" TIMESTAMP(3);
