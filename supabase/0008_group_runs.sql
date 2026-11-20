-- Group / community runs: a run can be marked as a community run with a name.
alter table public.runs add column if not exists run_type text not null default 'run';
alter table public.runs add column if not exists community_name text;
alter table public.runs drop constraint if exists runs_run_type_check;
alter table public.runs add constraint runs_run_type_check check (run_type in ('run','group'));
alter table public.runs drop constraint if exists runs_community_name_len;
alter table public.runs add constraint runs_community_name_len check (community_name is null or char_length(community_name) <= 60);
