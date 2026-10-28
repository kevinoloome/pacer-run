-- Pacer: worldwide runs
-- Run this in the Supabase SQL Editor (New query -> paste -> Run). Safe to run once.
--
-- 1. Adds `city` and `tz` (time zone) to runs. Every run now has a city, and its
--    date/time is shown in that city's local time.
-- 2. Marks all existing runs as Nairobi.

alter table runs add column if not exists city text;
alter table runs add column if not exists tz text;

update runs set city = 'Nairobi, Kenya', tz = 'Africa/Nairobi' where city is null;

alter table runs alter column city set default 'Nairobi, Kenya';
alter table runs alter column tz set default 'Africa/Nairobi';

create index if not exists runs_city_idx on runs (city);
