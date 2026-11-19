-- TwendeRun: run stories + unread chat markers
-- Run this in the Supabase SQL Editor AFTER 0006 (Project -> SQL Editor ->
-- New query -> paste -> Run). Safe to run more than once.
--
--   1. run_reads: remembers when each person last opened each run's chat, so
--      the app can show a "new messages" dot.
--   2. unread_counts(): how many new messages the signed-in person has per run.
--   3. run_stories: short stories ("I met my running partner here") that people
--      post about a run they were on. Visible to everyone for 14 days.

-- ---------------------------------------------------------------------
-- 1. Unread chat markers
-- ---------------------------------------------------------------------

create table if not exists run_reads (
  user_id uuid not null references auth.users(id) on delete cascade,
  run_id bigint not null references runs(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (user_id, run_id)
);

alter table run_reads enable row level security;

drop policy if exists "Read own run_reads" on run_reads;
create policy "Read own run_reads"
  on run_reads for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Insert own run_reads" on run_reads;
create policy "Insert own run_reads"
  on run_reads for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Update own run_reads" on run_reads;
create policy "Update own run_reads"
  on run_reads for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Messages from other people that arrived after you last opened the chat (or,
-- if you never opened it, after you joined). Runs on the caller's permissions,
-- so chat privacy rules still apply: you only ever count chats you belong to.
create or replace function unread_counts()
returns table (run_id bigint, unread bigint)
language sql
stable
set search_path = public
as $$
  select m.run_id, count(*)::bigint as unread
  from run_messages m
  left join run_reads rr on rr.run_id = m.run_id and rr.user_id = auth.uid()
  left join run_joins j on j.run_id = m.run_id and j.user_id = auth.uid()
  where m.user_id <> auth.uid()
    and m.created_at > coalesce(rr.last_read_at, j.joined_at, '-infinity'::timestamptz)
  group by m.run_id;
$$;

grant execute on function unread_counts() to authenticated;

-- ---------------------------------------------------------------------
-- 2. Run stories
-- ---------------------------------------------------------------------

create table if not exists run_stories (
  id bigint generated always as identity primary key,
  run_id bigint not null references runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  body text not null check (char_length(body) between 2 and 280),
  created_at timestamptz not null default now(),
  unique (run_id, user_id)            -- one story per person per run
);

create index if not exists run_stories_created_idx on run_stories (created_at desc);

alter table run_stories enable row level security;

-- Everyone signed in (guests included) can read stories from the last 14 days.
drop policy if exists "Read recent stories" on run_stories;
create policy "Read recent stories"
  on run_stories for select to authenticated
  using (created_at > now() - interval '14 days');

-- You can only post about a run you were on (host or joined), and only after it
-- has started, under your own account.
drop policy if exists "Post a story about your run" on run_stories;
create policy "Post a story about your run"
  on run_stories for insert to authenticated
  with check (
    auth.uid() = user_id
    and is_run_member(run_id)
    and exists (select 1 from runs where id = run_id and starts_at is not null and starts_at < now())
  );

drop policy if exists "Delete own story" on run_stories;
create policy "Delete own story"
  on run_stories for delete to authenticated
  using (auth.uid() = user_id);
