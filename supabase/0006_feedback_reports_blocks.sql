-- TwendeRun: feedback, reports and blocking
-- Run this in the Supabase SQL Editor (New query -> paste -> Run). Safe to run once.
--
-- feedback : messages people send from the app's Feedback page
-- reports  : "Report this run" submissions
-- blocks   : people a user has blocked (their runs and chat messages are hidden)
--
-- You read feedback and reports in Supabase: Table Editor -> feedback / reports.
-- People using the app can only add to them, never read them.

create table if not exists feedback (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  message text not null check (char_length(message) between 1 and 2000),
  contact text,
  page text,
  created_at timestamptz not null default now()
);
alter table feedback enable row level security;
drop policy if exists "Signed-in users can send feedback" on feedback;
create policy "Signed-in users can send feedback"
  on feedback for insert
  to authenticated
  with check (auth.uid() = user_id);

create table if not exists reports (
  id bigint generated always as identity primary key,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  run_id bigint references runs(id) on delete set null,
  reported_user_id uuid,
  reason text not null,
  details text,
  created_at timestamptz not null default now()
);
alter table reports enable row level security;
drop policy if exists "Signed-in users can report" on reports;
create policy "Signed-in users can report"
  on reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

create table if not exists blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table blocks enable row level security;
drop policy if exists "Users see their own blocks" on blocks;
create policy "Users see their own blocks"
  on blocks for select to authenticated using (auth.uid() = blocker_id);
drop policy if exists "Users can block" on blocks;
create policy "Users can block"
  on blocks for insert to authenticated with check (auth.uid() = blocker_id);
drop policy if exists "Users can unblock" on blocks;
create policy "Users can unblock"
  on blocks for delete to authenticated using (auth.uid() = blocker_id);
