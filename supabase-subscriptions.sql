-- Standing Order (monthly subscription). Run once in the Supabase SQL Editor, after
-- supabase-crumb-points.sql. Safe to run again.

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
