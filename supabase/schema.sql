create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz default now()
);

create table if not exists shipments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  tracking_number text unique not null,
  origin text default 'United States',
  status text default 'Pending Review',
  current_point_index integer default 0,
  estimated_days integer default 0,
  sender_name text not null,
  sender_phone text not null,
  sender_email text,
  receiver_name text not null,
  receiver_phone text not null,
  receiver_email text,
  destination_country text not null,
  destination_city text not null,
  destination_address text not null,
  item text not null,
  category text,
  box_size text,
  length numeric default 0,
  width numeric default 0,
  height numeric default 0,
  weight_kg numeric default 0,
  quantity integer default 1,
  declared_value numeric default 0,
  mode text not null check (mode in ('air', 'sea', 'express')),
  pickup_option text,
  insured boolean default false,
  fragile boolean default false,
  notes text,
  admin_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists shipment_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid references shipments(id) on delete cascade,
  point_id text,
  title text not null,
  status text not null,
  location text,
  city text,
  country text,
  latitude numeric,
  longitude numeric,
  note text,
  scanned_at timestamptz default now()
);

alter table profiles enable row level security;
alter table shipments enable row level security;
alter table shipment_events enable row level security;

create policy "Users can read their profile" on profiles for select using (auth.uid() = id);
create policy "Users can update their profile" on profiles for update using (auth.uid() = id);

create policy "Users can read their shipments" on shipments for select using (auth.uid() = user_id);
create policy "Users can create their shipments" on shipments for insert with check (auth.uid() = user_id);

create policy "Admins can read all shipments" on shipments for select using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

create policy "Admins can update all shipments" on shipments for update using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

create policy "Users can read their shipment events" on shipment_events for select using (
  exists (select 1 from shipments where shipments.id = shipment_events.shipment_id and shipments.user_id = auth.uid())
);

create policy "Admins can manage shipment events" on shipment_events for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);
