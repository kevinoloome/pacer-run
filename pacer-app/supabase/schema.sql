-- Pacer: initial database schema
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query → paste → Run).
--
-- This starts with just the `runs` table, enough to get Discover reading from a real
-- database. Profiles, joins-as-their-own-table, messages, ratings, and reports come
-- later, once auth is wired in (a run's `joined` list only makes sense once there are
-- real users to reference).

create table if not exists runs (
  id bigint generated always as identity primary key,
  location text not null,
  when_text text not null,          -- display text for now, e.g. "Tomorrow, 6:00 AM"
  distance_km numeric not null,
  surface text not null check (surface in ('trail', 'road', 'track')),
  day_cat text not null check (day_cat in ('weekday', 'weekend')),
  pace_sec int not null,            -- pace in seconds per km, e.g. 5:30/km = 330
  weather_icon text,
  weather_temp int,
  weather_rain int,
  note text,
  host_name text not null,
  host_verified boolean not null default false,
  host_meta text,
  host_photo boolean not null default false,
  capacity int not null default 6,
  joined text[] not null default '{}',  -- temporary: initials array, becomes a real
                                         -- join table once user accounts exist
  created_at timestamptz not null default now()
);

-- Row Level Security: on by default in Supabase. For now, allow anyone to read runs
-- (Discover needs to be publicly browsable), but only the service role can write,
-- until real auth + "post a run" is built.
alter table runs enable row level security;

create policy "Anyone can view runs"
  on runs for select
  using (true);

-- Seed data: the same four mock runs from the prototype, so Discover has something
-- real to show immediately.
insert into runs
  (location, when_text, distance_km, surface, day_cat, pace_sec, weather_icon, weather_temp, weather_rain, note, host_name, host_verified, host_meta, host_photo, capacity, joined)
values
  ('Karura Forest, Limuru Rd gate', 'Tomorrow, 6:00 AM', 8, 'trail', 'weekday', 330, '⛅', 16, 10, 'Easy conversational pace through the forest loop. One water stop. Back by 7.', 'Zawadi M.', true, '5:20-5:45 pace, 41 runs, 4.9 stars', true, 6, '{Z,T,K}'),
  ('Ngong Road Track', 'Sat, 6:30 AM', 10, 'track', 'weekend', 290, '☀️', 18, 0, 'Tempo intervals, 6x1km. Come warmed up, this one''s brisk.', 'David O.', true, '4:40-5:00 pace, 76 runs, 4.8 stars', true, 8, '{D,M,R,S,L}'),
  ('Uhuru Park loop', 'Tomorrow, 6:15 AM', 5, 'road', 'weekday', 370, '⛅', 15, 10, 'First-timer friendly. Flat loop, we chat more than we run.', 'Faith N.', false, '5:50-6:30 pace, 12 runs, 4.6 stars', false, 5, '{F}'),
  ('Kileleshwa, Rose Ave loop', 'Sun, 7:00 AM', 12, 'road', 'weekend', 310, '🌦️', 17, 45, 'Long run, race-pace effort in the last 3km. Bring your own water.', 'Peter K.', true, '5:00-5:20 pace, 58 runs, 5.0 stars', true, 2, '{P,J}');
