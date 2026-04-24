-- Run in the Supabase SQL Editor (after `public.profiles` exists).
-- Creates a profile row whenever a new `auth.users` row is inserted, so FKs (e.g. `purchases.userId`) resolve.
-- Must set all NOT NULL columns: Prisma maps `createdAt` / `updatedAt` (camelCase, quoted in PostgreSQL).
--
-- Phase 1a (2026-04-24): also captures firstName/lastName from signup metadata:
--   * Email signup: reads `first_name` / `last_name` from `options.data` passed to `supabase.auth.signUp`.
--   * Google OAuth: falls back to `given_name` / `family_name`, then first/last word of `full_name`/`name`.

create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_first_name text;
  v_last_name  text;
  v_full_name  text;
begin
  v_full_name := coalesce(
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'name', '')
  );

  v_first_name := coalesce(
    nullif(new.raw_user_meta_data->>'first_name', ''),
    nullif(new.raw_user_meta_data->>'given_name', ''),
    nullif(split_part(v_full_name, ' ', 1), '')
  );

  v_last_name := coalesce(
    nullif(new.raw_user_meta_data->>'last_name', ''),
    nullif(new.raw_user_meta_data->>'family_name', ''),
    case
      when v_full_name is not null and position(' ' in v_full_name) > 0
        then nullif(substring(v_full_name from position(' ' in v_full_name) + 1), '')
      else null
    end
  );

  insert into public.profiles (id, email, "firstName", "lastName", "createdAt", "updatedAt")
  values (
    new.id,
    new.email,
    v_first_name,
    v_last_name,
    now(),
    now()
  )
  on conflict (id) do update
    set email       = excluded.email,
        "firstName" = coalesce(profiles."firstName", excluded."firstName"),
        "lastName"  = coalesce(profiles."lastName",  excluded."lastName"),
        "updatedAt" = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
