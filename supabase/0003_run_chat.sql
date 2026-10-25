-- Pacer: per-run chat
-- Run this in the Supabase SQL Editor AFTER schema.sql and
-- 0002_auth_and_joins.sql (Project -> SQL Editor -> New query -> paste -> Run).
-- Safe to run more than once.
--
-- Each run gets a private chat. Only the run's host and the people who have
-- joined it can read or write messages.

create table if not exists run_messages (
  id bigint generated always as identity primary key,
  run_id bigint not null references runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sender_name text not null,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists run_messages_run_created_idx
  on run_messages (run_id, created_at);

-- True when the signed-in user hosts the run or has joined it. SECURITY
-- DEFINER so the policies below can check membership without needing extra
-- permissions on the runs table.
create or replace function is_run_member(rid bigint)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    exists (select 1 from runs where id = rid and host_id = auth.uid())
    or exists (select 1 from run_joins where run_id = rid and user_id = auth.uid());
$$;

alter table run_messages enable row level security;

drop policy if exists "Run members can read chat" on run_messages;
create policy "Run members can read chat"
  on run_messages for select
  to authenticated
  using (is_run_member(run_id));

drop policy if exists "Run members can post in chat" on run_messages;
create policy "Run members can post in chat"
  on run_messages for insert
  to authenticated
  with check (auth.uid() = user_id and is_run_member(run_id));

-- Live updates: let the app receive new messages instantly.
do $$
begin
  alter publication supabase_realtime add table run_messages;
exception
  when duplicate_object then null;
end
$$;
