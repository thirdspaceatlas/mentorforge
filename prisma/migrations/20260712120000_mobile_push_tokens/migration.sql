-- CreateTable
CREATE TABLE "mobile_push_tokens" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expoPushToken" TEXT NOT NULL,
    "platform" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mobile_push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mobile_push_tokens_expoPushToken_key" ON "mobile_push_tokens"("expoPushToken");

-- CreateIndex
CREATE INDEX "mobile_push_tokens_userId_idx" ON "mobile_push_tokens"("userId");

-- AddForeignKey
ALTER TABLE "mobile_push_tokens" ADD CONSTRAINT "mobile_push_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
