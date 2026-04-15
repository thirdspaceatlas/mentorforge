-- Supabase Advisor may flag `_prisma_migrations` as publicly accessible when RLS is disabled.
-- Enable RLS there (and on any other `public` tables still missing it) to prevent access via the
-- Supabase Data API (PostgREST) using the anon key.
--
-- Prisma (server-side) continues to function because the database role used by Prisma connections
-- bypasses RLS; this change is about closing the REST/API surface area.

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relrowsecurity = false
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

