-- Run in Supabase SQL Editor after Prisma has created the `profiles` table.
-- Keeps `public.profiles.id` aligned with `auth.users.id` for foreign keys.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
