create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz default now()
);

create table if not exists shipments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  tracking_number text unique not null,
  recipient text not null,
  item text not null,
  mode text not null check (mode in ('air', 'sea', 'express')),
  origin text default 'United States',
  destination text default 'Ghana',
  status text default 'Registered in the United States',
  current_point_index integer default 0,
  estimated_days integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists shipment_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid references shipments(id) on delete cascade,
  point_id text not null,
  title text not null,
  city text not null,
  country text not null,
  latitude numeric not null,
  longitude numeric not null,
  note text,
  scanned_at timestamptz default now()
);

alter table profiles enable row level security;
alter table shipments enable row level security;
alter table shipment_events enable row level security;

create policy "Users can read their profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update their profile" on profiles
  for update using (auth.uid() = id);

create policy "Users can read their shipments" on shipments
  for select using (auth.uid() = user_id);

create policy "Users can create their shipments" on shipments
  for insert with check (auth.uid() = user_id);

create policy "Users can update their shipments" on shipments
  for update using (auth.uid() = user_id);

create policy "Users can read their shipment events" on shipment_events
  for select using (
    exists (
      select 1 from shipments
      where shipments.id = shipment_events.shipment_id
      and shipments.user_id = auth.uid()
    )
  );
