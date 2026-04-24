-- Web push subscriptions (VAPID). One row per device per user.

CREATE TABLE "push_subscriptions" (
  "id"        TEXT NOT NULL,
  "userId"    UUID NOT NULL,
  "endpoint"  TEXT NOT NULL,
  "p256dh"    TEXT NOT NULL,
  "auth"      TEXT NOT NULL,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "push_subscriptions_endpoint_key"
  ON "push_subscriptions" ("endpoint");

CREATE INDEX "push_subscriptions_userId_idx"
  ON "push_subscriptions" ("userId");

ALTER TABLE "push_subscriptions"
  ADD CONSTRAINT "push_subscriptions_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "push_subscriptions" ENABLE ROW LEVEL SECURITY;
