-- Run in the Supabase SQL Editor (after `public.profiles` exists).
-- Creates a profile row whenever a new `auth.users` row is inserted, so FKs (e.g. `purchases.userId`) resolve.
-- Must set all NOT NULL columns: Prisma maps `createdAt` / `updatedAt` (camelCase, quoted in PostgreSQL).

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, "createdAt", "updatedAt")
  values (
    new.id,
    new.email,
    now(),
    now()
  )
  on conflict (id) do update
    set email = excluded.email,
        "updatedAt" = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
