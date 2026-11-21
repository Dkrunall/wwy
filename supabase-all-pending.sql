-- All pending changes in one script: in-house delivery, Crumb Points, Standing Order.
-- Run once in the Supabase SQL Editor BEFORE deploying the new code. Safe to run again.
-- It runs as one transaction: if anything fails, nothing is changed.
-- (supabase-lock-all.sql is separate and goes AFTER the deploy.)

begin;

-- ============================================================
-- In-house delivery, rider tracking and push (supabase-delivery-partner.sql)
-- ============================================================
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

-- ============================================================
-- Crumb Points and free-delivery phone list (supabase-crumb-points.sql)
-- ============================================================
-- One row per credit movement. A customer's balance is the sum of amount_paise.
-- source: cart_tier (earned on a delivered, paid order), sub (earned on a Standing Order bake),
-- redeem (spent at checkout or on a free loaf),
-- earn_reversal / redeem_return (order cancelled or refunded), expiry, adjustment (OMS).
create table if not exists ledger_entries (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  bake_date date,
  source text not null check (source in ('cart_tier','sub','redeem','earn_reversal','redeem_return','expiry','adjustment')),
  amount_paise integer not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists ledger_entries_customer_idx on ledger_entries (customer_id, created_at);
-- Each order earns, spends, and is reversed at most once. Rows without an order (expiry,
-- adjustment) have a null order_id, and nulls never clash in a unique index.
create unique index if not exists ledger_entries_order_source_idx on ledger_entries (order_id, source);
alter table ledger_entries enable row level security;

-- Credit spent on an order (taken off the goods before GST, shown on the invoice).
alter table orders add column if not exists credit_used_paise integer not null default 0;

-- Existing customers whose orders always ship free. Store the last 10 digits of the phone number.
create table if not exists free_delivery_phones (
  phone text primary key check (phone ~ '^[0-9]{10}$'),
  note text,
  created_at timestamptz not null default now()
);
alter table free_delivery_phones enable row level security;

-- ============================================================
-- Standing Order (supabase-subscriptions.sql)
-- ============================================================
-- One subscription per customer. days: which bake days the loaves come on.
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null unique references customers(id) on delete cascade,
  days text not null check (days in ('wed','sat','both')),
  -- pending: waiting for the first payment; active: renews monthly; cancelled: won't renew.
  status text not null default 'pending' check (status in ('pending','active','cancelled')),
  -- Value of skipped bakes, taken off the next payment.
  carry_forward_paise integer not null default 0,
  -- Bakes in a row without a skip; at 8 the next bake carries 2 free Baker's Choice loaves.
  streak_count integer not null default 0,
  streak_reward_due boolean not null default false,
  -- The paid period a renewal reminder was last sent for (one reminder per period).
  reminded_period_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per monthly payment (4 weeks of bakes).
create table if not exists subscription_periods (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references subscriptions(id) on delete cascade,
  amount_paise integer not null,
  loaf_price_paise integer not null,
  carry_used_paise integer not null default 0,
  payment_status text not null default 'pending' check (payment_status in ('pending','paid')),
  razorpay_order_id text unique,
  razorpay_payment_id text,
  starts_on date,
  ends_on date,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists subscription_periods_sub_idx on subscription_periods (subscription_id, created_at);

-- Each bake a paid period covers. An order is created for it once the order cutoff passes.
create table if not exists subscription_bakes (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references subscriptions(id) on delete cascade,
  period_id uuid not null references subscription_periods(id) on delete cascade,
  bake_date date not null,
  loaves integer not null,
  flavour text,
  status text not null default 'scheduled' check (status in ('scheduled','skipped','ordered')),
  order_id uuid references orders(id) on delete set null,
  unique (subscription_id, bake_date)
);
create index if not exists subscription_bakes_date_idx on subscription_bakes (bake_date, status);

alter table subscriptions enable row level security;
alter table subscription_periods enable row level security;
alter table subscription_bakes enable row level security;

-- Price of one Standing Order loaf (paise). Change it in OMS -> Settings.
insert into settings (key, value) values ('sub_loaf_price_paise', '37500') on conflict (key) do nothing;

commit;

-- Check
select delivery_partner, count(*) from orders group by delivery_partner;
select key, value from settings where key like 'in_house_rider%';
select count(*) as ledger_entries from ledger_entries;
select key, value from settings where key = 'sub_loaf_price_paise';
