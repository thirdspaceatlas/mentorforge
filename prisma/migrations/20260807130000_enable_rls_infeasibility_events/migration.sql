-- Block anonymous PostgREST access (same pattern as push_subscriptions).
-- Server-side Prisma bypasses RLS; no permissive policies needed.
ALTER TABLE "infeasibility_events" ENABLE ROW LEVEL SECURITY;
