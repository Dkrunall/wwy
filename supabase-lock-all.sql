-- Lock down the whole public schema (P4-3). Replaces supabase-lock-products.sql.
-- Run in Supabase SQL Editor ONLY AFTER the new code is deployed and OMS_SESSION_SECRET
-- is set in Vercel. Run it in one go; it is a single transaction.
--
-- Result:
--   products                  anon + customers: read only
--   customers                 a logged-in customer: read/insert own row, update phone + address only
--   orders, order_items       a logged-in customer: read their own orders only
--   feedbacks                 a logged-in customer: read feedback on their own orders
--   everything else           no browser access at all (coupons, bakers, settings, sessions, ...)
-- The server (service-role key) bypasses RLS, so API routes, the OMS proxy and webhooks keep working.

begin;

-- 1. Enable RLS on every table in public and drop every existing policy (including the open ones).
do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', r.tablename);
  end loop;
  for r in select schemaname, tablename, policyname from pg_policies where schemaname = 'public' loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- 2. Strip direct table privileges; add back only what the browser needs.
do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format('revoke all on table public.%I from anon, authenticated', r.tablename);
  end loop;
end $$;

grant select on products to anon, authenticated;
grant select, insert on customers to authenticated;
grant update (phone, address) on customers to authenticated;
grant select on orders, order_items, feedbacks to authenticated;

-- 3. Policies.
create policy products_public_read on products for select using (true);

create policy customers_select_own on customers for select to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));
create policy customers_insert_own on customers for insert to authenticated
  with check (lower(email) = lower(auth.jwt() ->> 'email'));
create policy customers_update_own on customers for update to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'))
  with check (lower(email) = lower(auth.jwt() ->> 'email'));

create policy orders_select_own on orders for select to authenticated
  using (customer_id in (select id from customers where lower(email) = lower(auth.jwt() ->> 'email')));

create policy order_items_select_own on order_items for select to authenticated
  using (order_id in (
    select o.id from orders o
    where o.customer_id in (select id from customers where lower(email) = lower(auth.jwt() ->> 'email'))
  ));

create policy feedbacks_select_own on feedbacks for select to authenticated
  using (order_id in (
    select o.id from orders o
    where o.customer_id in (select id from customers where lower(email) = lower(auth.jwt() ->> 'email'))
  ));

-- 4. Check: rls_on should be true everywhere; only the policies above should be listed.
select tablename, rowsecurity as rls_on from pg_tables where schemaname = 'public' order by tablename;
select tablename, policyname, cmd, roles from pg_policies where schemaname = 'public' order by tablename;

commit;
