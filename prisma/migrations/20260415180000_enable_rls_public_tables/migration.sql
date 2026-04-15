-- Block anonymous PostgREST access: Supabase exposes `public` via Data API + anon key.
-- This app reads/writes only through Prisma (server-side); the DB role used there bypasses RLS.
-- With RLS enabled and no permissive policies, `anon` / `authenticated` cannot read tables via REST.

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
      AND c.relname NOT IN ('_prisma_migrations')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
