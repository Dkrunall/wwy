-- Database changes for the website action plan. Safe to re-run.
-- Run in Supabase SQL Editor BEFORE supabase-lock-all.sql.

-- P3-6 / D4: WhatsApp opt-in list. Written only by the server (service-role key).
create table if not exists newsletter_signups (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  consent_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  source text not null default 'website',
  created_at timestamptz not null default now()
);
alter table newsletter_signups enable row level security;

-- P3-1: Legal Metrology e-commerce declarations on every product.
alter table products add column if not exists ingredients text;
alter table products add column if not exists allergens text;
alter table products add column if not exists net_quantity text;
alter table products add column if not exists best_before text;
alter table products add column if not exists storage text;
alter table products add column if not exists manufacturer_name text;       -- white-label items only
alter table products add column if not exists manufacturer_address text;
alter table products add column if not exists manufacturer_fssai text;

-- GST invoice columns (already in supabase-migration.sql; some databases are missing them).
alter table products add column if not exists hsn_code text;
alter table products add column if not exists gst_rate numeric(5,2) not null default 0;

-- P2-1: one cutoff rule. Orders close at 9 PM IST, two days before the delivery day
-- (9 PM Monday for Wednesday, 9 PM Thursday for Saturday). This overrides any older value.
insert into settings (key, value) values ('cutoff_hour_ist', '21')
on conflict (key) do update set value = excluded.value;
