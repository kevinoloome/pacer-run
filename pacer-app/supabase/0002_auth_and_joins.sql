-- Pacer: accounts, hosting, and joining
-- Run this in the Supabase SQL Editor AFTER schema.sql (Project -> SQL Editor
-- -> New query -> paste -> Run). Safe to run once; re-running is guarded with
-- `if not exists` / `or replace` everywhere it matters.
--
-- What this adds:
--   1. profiles: one row per signed-up user (created automatically on signup)
--   2. runs.host_id: links a run to the real account that posted it
--   3. run_joins: one row per "I'm going" (replaces the placeholder initials
--      array from schema.sql for anything written going forward)
--   4. RLS policies so a signed-in user can post a run and join a run, while
--      everyone (signed in or not) can still browse

-- ---------------------------------------------------------------------
-- 1. Profiles
-- ---------------------------------------------------------------------

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  pace_min_sec int,              -- comfortable pace range, seconds/km
  pace_max_sec int,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on profiles;
create policy "Profiles are viewable by everyone"
  on profiles for select
  using (true);

drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on profiles;
create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Auto-create a profile row the moment someone signs up, so the app never
-- has to handle "signed in but no profile exists yet".
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------------------------------------------------------------------
-- 2. Runs: link each run to the real account that posted it
-- ---------------------------------------------------------------------

alter table runs add column if not exists host_id uuid references auth.users(id);

drop policy if exists "Signed-in users can post a run" on runs;
create policy "Signed-in users can post a run"
  on runs for insert
  to authenticated
  with check (auth.uid() = host_id);

drop policy if exists "Hosts can update their own runs" on runs;
create policy "Hosts can update their own runs"
  on runs for update
  to authenticated
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

-- ---------------------------------------------------------------------
-- 3. Run joins: one row per "I'm going", replacing the old `joined` text[]
--    placeholder for anything written from here on. The app reads a run's
--    live joined count from this table, not from `runs.joined`.
-- ---------------------------------------------------------------------

create table if not exists run_joins (
  id bigint generated always as identity primary key,
  run_id bigint not null references runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (run_id, user_id)
);

alter table run_joins enable row level security;

drop policy if exists "Anyone can view who joined a run" on run_joins;
create policy "Anyone can view who joined a run"
  on run_joins for select
  using (true);

drop policy if exists "Signed-in users can join a run" on run_joins;
create policy "Signed-in users can join a run"
  on run_joins for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can leave a run they joined" on run_joins;
create policy "Users can leave a run they joined"
  on run_joins for delete
  to authenticated
  using (auth.uid() = user_id);
