-- Harborlight Hotel Operations — full schema
-- Run in the Supabase SQL editor (demo policies — not for production).

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

create table if not exists public.room_types (
  id bigint generated always as identity primary key,
  name text not null unique,
  capacity int not null default 2,
  base_rate numeric(10,2) not null default 0
);

create table if not exists public.rooms (
  id bigint generated always as identity primary key,
  room_number text not null unique,
  status room_status not null default 'ready',
  last_updated timestamptz not null default now(),
  room_type_id bigint references public.room_types(id),
  floor int not null default 1
);

create table if not exists public.staff_members (
  id bigint generated always as identity primary key,
  name text not null,
  role text not null check (role in ('frontdesk', 'housekeeping', 'manager'))
);

create table if not exists public.reservations (
  id bigint generated always as identity primary key,
  room_id bigint not null references public.rooms(id),
  guest_name text not null,
  email text not null default '',
  phone text not null default '',
  check_in_date date not null,
  check_out_date date not null,
  source text not null check (source in ('walk_in', 'ota', 'phone')),
  status text not null check (status in ('booked', 'checked_in', 'checked_out', 'cancelled')),
  nightly_rate numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.folios (
  id bigint generated always as identity primary key,
  reservation_id bigint not null references public.reservations(id),
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.folio_charges (
  id bigint generated always as identity primary key,
  folio_id bigint not null references public.folios(id),
  description text not null,
  amount numeric(10,2) not null,
  category text not null check (category in ('room', 'fnb', 'service', 'other')),
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id bigint generated always as identity primary key,
  folio_id bigint not null references public.folios(id),
  amount numeric(10,2) not null,
  method text not null check (method in ('cash', 'card', 'transfer')),
  paid_at timestamptz not null default now()
);

create table if not exists public.requests (
  id bigint generated always as identity primary key,
  room_number text not null,
  request_type text not null check (request_type in (
    'towels',
    'housekeeping',
    'late_checkout',
    'food',
    'hotel_services',
    'digital_checkout'
  )),
  status text not null default 'pending' check (status in ('pending', 'completed')),
  created_at timestamptz not null default now(),
  notes text,
  photo_url text,
  completed_by_staff_id bigint references public.staff_members(id),
  completed_at timestamptz
);

create table if not exists public.room_status_events (
  id bigint generated always as identity primary key,
  room_id bigint not null references public.rooms(id),
  from_status room_status not null,
  to_status room_status not null,
  staff_id bigint references public.staff_members(id),
  at timestamptz not null default now()
);

-- Open demo RLS
do $$
declare
  t text;
begin
  foreach t in array array[
    'room_types','rooms','staff_members','reservations','folios',
    'folio_charges','payments','requests','room_status_events'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s_all" on public.%I', t, t);
    execute format(
      'create policy "%s_all" on public.%I for all to anon, authenticated using (true) with check (true)',
      t, t
    );
  end loop;
end
$$;

insert into public.room_types (name, capacity, base_rate)
values
  ('Standard', 2, 89),
  ('Deluxe', 3, 129),
  ('Suite', 4, 189)
on conflict (name) do update
set capacity = excluded.capacity, base_rate = excluded.base_rate;

insert into public.staff_members (name, role)
select * from (values
  ('Maya Chen', 'frontdesk'),
  ('Jordan Blake', 'frontdesk'),
  ('Sofia Rivera', 'housekeeping'),
  ('Sam Okonkwo', 'housekeeping'),
  ('Alex Morgan', 'manager')
) as v(name, role)
where not exists (select 1 from public.staff_members limit 1);

insert into public.rooms (room_number, status, last_updated, room_type_id, floor)
select
  room_num::text,
  (array['ready', 'occupied', 'needs_cleaning', 'cleaning', 'maintenance'])[((row_num - 1) % 5) + 1]::room_status,
  now() - make_interval(mins => row_num * 8),
  ((row_num - 1) % 3) + 1,
  (room_num / 100)::int
from (
  select room_num, row_number() over (order by room_num) as row_num
  from generate_series(101, 120) as room_num
) as generated
on conflict (room_number) do update
set
  status = excluded.status,
  last_updated = excluded.last_updated,
  room_type_id = excluded.room_type_id,
  floor = excluded.floor;

insert into public.requests (room_number, request_type, status, created_at, notes)
values
  ('104', 'towels', 'pending', now() - interval '7 minutes', 'Extra bath towels'),
  ('118', 'late_checkout', 'pending', now() - interval '15 minutes', 'Requesting 2pm checkout'),
  ('115', 'housekeeping', 'pending', now() - interval '22 minutes', null)
on conflict do nothing;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table public.rooms;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'requests'
  ) then
    alter publication supabase_realtime add table public.requests;
  end if;
end
$$;
