-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- Products
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text,
  price_paise integer not null,
  available boolean default true,
  created_at timestamptz default now()
);

-- Customers (flat number = identity, no password)
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  flat_number text not null unique,
  phone text,
  created_at timestamptz default now()
);

-- Orders
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  flat_number text not null,
  customer_name text not null,
  status text default 'pending' check (status in ('pending','confirmed','delivered')),
  total_paise integer not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Order items
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  product_name text not null,
  quantity integer not null,
  unit_price_paise integer not null
);

-- Seed products
insert into products (name, category, description, price_paise, available) values
  ('Wild Botanicals', 'Sodas', 'Hibiscus and wild ginger. Slow-fermented over 72 hours.', 18000, true),
  ('Golden Fizz', 'Sodas', 'Turmeric, green cardamom, raw cane. Probiotic. Alive in every sip.', 18000, true),
  ('Wild Starter', 'Starters', 'A living sourdough culture. Built on a century-old strain. Ready to bake.', 45000, true),
  ('Sourdough Loaf', 'Breads', 'Wild-fermented, long-proofed. The one everyone orders.', 28000, true),
  ('Multigrain Bread', 'Breads', 'Seeds, grains, and good intentions.', 22000, true),
  ('The Iron Tin', 'Storage', 'Designed to keep your starter alive. Airtight. Measured.', 85000, true),
  ('Sampler Kit', 'Bundles', 'Two sodas, one starter, one tin. A complete introduction to living food.', 120000, true)
on conflict do nothing;

-- Row-level security (optional but recommended)
alter table products enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Allow public read on products
create policy "products_public_read" on products for select using (true);

-- Allow all on customers, orders, order_items (for anon key — tighten later)
create policy "customers_all" on customers for all using (true);
create policy "orders_all" on orders for all using (true);
create policy "order_items_all" on order_items for all using (true);

-- Allow admin to insert/update/delete products
create policy "products_admin_write" on products for all using (true);
