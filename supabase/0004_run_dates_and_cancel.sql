-- Pacer: real run dates + cancelling a run
-- Run this in the Supabase SQL Editor AFTER 0003_run_chat.sql
-- (Project -> SQL Editor -> New query -> paste -> Run). Safe to run more than once.
--
--   1. runs.starts_at: the real start date and time. Runs that have started
--      are hidden from Discover automatically. Older runs without a date
--      (the sample runs, early test runs) are left as they are.
--   2. runs.cancelled_at: set when the host cancels a run. Cancelled runs
--      are hidden from Discover and nobody can join them.
--
-- Hosts can already edit their own runs (policy from 0002_auth_and_joins.sql).

alter table runs add column if not exists starts_at timestamptz;
alter table runs add column if not exists cancelled_at timestamptz;

create index if not exists runs_starts_at_idx on runs (starts_at);

-- Joining: same capacity check as before, plus refuse cancelled runs.
create or replace function check_run_capacity()
returns trigger as $$
declare
  run_capacity int;
  legacy_count int;
  current_count int;
  run_cancelled timestamptz;
begin
  select capacity, coalesce(array_length(joined, 1), 0), cancelled_at
    into run_capacity, legacy_count, run_cancelled
    from runs where id = new.run_id;

  if run_cancelled is not null then
    raise exception 'run_cancelled' using errcode = 'P0001';
  end if;

  select count(*) into current_count from run_joins where run_id = new.run_id;

  if (legacy_count + current_count) >= run_capacity then
    raise exception 'run_full' using errcode = 'P0001';
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;
