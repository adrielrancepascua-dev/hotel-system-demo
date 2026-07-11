-- Hotel operations demo schema for Supabase
-- Run this in the Supabase SQL editor.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'room_status') then
    create type room_status as enum (
      'occupied',
      'needs_cleaning',
      'cleaning',
      'ready',
      'maintenance'
    );
  end if;
end
$$;

create table if not exists public.rooms (
  id bigint generated always as identity primary key,
  room_number text not null unique,
  status room_status not null default 'ready',
  last_updated timestamptz not null default now()
);

create table if not exists public.requests (
  id bigint generated always as identity primary key,
  room_number text not null,
  request_type text not null check (request_type in (
    'towels',
    'housekeeping',
    'late_checkout',
    'food',
    'hotel_services'
  )),
  status text not null default 'pending' check (status in ('pending', 'completed')),
  created_at timestamptz not null default now()
);

alter table public.rooms enable row level security;
alter table public.requests enable row level security;

-- Open demo policies (not for production).
drop policy if exists "rooms_select_all" on public.rooms;
create policy "rooms_select_all"
  on public.rooms
  for select
  to anon, authenticated
  using (true);

drop policy if exists "rooms_update_all" on public.rooms;
create policy "rooms_update_all"
  on public.rooms
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "requests_select_all" on public.requests;
create policy "requests_select_all"
  on public.requests
  for select
  to anon, authenticated
  using (true);

drop policy if exists "requests_insert_all" on public.requests;
create policy "requests_insert_all"
  on public.requests
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "requests_update_all" on public.requests;
create policy "requests_update_all"
  on public.requests
  for update
  to anon, authenticated
  using (true)
  with check (true);

insert into public.rooms (room_number, status, last_updated)
select
  room_num::text,
  (array['ready', 'occupied', 'needs_cleaning', 'cleaning', 'maintenance'])[((row_num - 1) % 5) + 1]::room_status,
  now() - make_interval(mins => row_num * 8)
from (
  select room_num, row_number() over (order by room_num) as row_num
  from generate_series(101, 120) as room_num
) as generated
on conflict (room_number) do update
set
  status = excluded.status,
  last_updated = excluded.last_updated;

insert into public.requests (room_number, request_type, status, created_at)
values
  ('104', 'towels', 'pending', now() - interval '7 minutes'),
  ('118', 'late_checkout', 'pending', now() - interval '15 minutes'),
  ('115', 'housekeeping', 'pending', now() - interval '22 minutes')
on conflict do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table public.rooms;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'requests'
  ) then
    alter publication supabase_realtime add table public.requests;
  end if;
end
$$;
