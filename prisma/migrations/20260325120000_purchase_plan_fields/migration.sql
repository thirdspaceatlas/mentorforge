-- AlterTable
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "examWindow" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "examYear" INTEGER;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "accessExpiresAt" TIMESTAMP(3);
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "levelUnlocked" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "purchases_stripeSubscriptionId_key" ON "purchases"("stripeSubscriptionId");
