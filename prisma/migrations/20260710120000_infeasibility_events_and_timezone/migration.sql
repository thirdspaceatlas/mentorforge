-- FORGE-3 / Phase 2: additive only. Adds per-user IANA timezone and the
-- first-class infeasibility-event history table. Does not alter existing tables
-- beyond the new nullable column.

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "timeZone" TEXT;

-- CreateTable
CREATE TABLE "infeasibility_events" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "unplaceableMinutes" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "optionsOffered" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "context" JSONB,
    "resolutionKind" TEXT,
    "resolutionImpact" JSONB,
    "resolvedFeasible" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "infeasibility_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "infeasibility_events_userId_createdAt_idx" ON "infeasibility_events"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "infeasibility_events" ADD CONSTRAINT "infeasibility_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
