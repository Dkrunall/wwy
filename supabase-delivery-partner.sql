-- In-house delivery (our rider, default) or Borzo, plus our own live tracking. Safe to re-run.
-- Run this in the Supabase SQL Editor BEFORE deploying the code that uses it.

-- Who delivers each order.
alter table orders add column if not exists delivery_partner text not null default 'in_house';
alter table orders add column if not exists delivery_person text;   -- whoever is delivering, e.g. Nilesh or Borzo
do $$ begin
  alter table orders add constraint orders_delivery_partner_check check (delivery_partner in ('in_house', 'borzo'));
exception when duplicate_object then null;
end $$;

-- Private link for the customer's tracking page (/track/<token>). Every order gets its own.
alter table orders add column if not exists tracking_token uuid not null default gen_random_uuid();
create unique index if not exists orders_tracking_token_idx on orders (tracking_token);

-- The rider's last known position, shared from the rider page. Read and written only by the server.
create table if not exists rider_locations (
  rider text primary key,               -- 'in_house'
  lat double precision not null,
  lng double precision not null,
  accuracy real,
  updated_at timestamptz not null default now()
);
alter table rider_locations enable row level security;

-- Phones that asked for push notifications from the rider page. Read and written only by the server.
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  rider text not null default 'in_house',
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
alter table push_subscriptions enable row level security;

-- The in-house rider. Change these values if the rider changes.
insert into settings (key, value) values ('in_house_rider_name', 'Nilesh') on conflict (key) do nothing;
insert into settings (key, value) values ('in_house_rider_phone', '') on conflict (key) do nothing;
insert into settings (key, value) values ('in_house_rider_email', '') on conflict (key) do nothing;   -- fill in Nilesh's email
-- Secret for the rider page link (/rider/<token>). Change it to revoke an old link.
insert into settings (key, value) values ('in_house_rider_token', md5(random()::text || clock_timestamp()::text))
on conflict (key) do nothing;

-- Check
select delivery_partner, count(*) from orders group by delivery_partner;
select key, value from settings where key like 'in_house_rider%';
