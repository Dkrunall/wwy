-- Crumb Points (promotional credit) and the free-delivery phone list.
-- Run once in the Supabase SQL Editor. Safe to run again.

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
