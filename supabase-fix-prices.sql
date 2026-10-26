-- P0-1: set real MRPs on the products table.
-- Run in Supabase SQL Editor (Dashboard -> SQL Editor).
-- price_paise = MRP in rupees x 100, MRP inclusive of all taxes (e.g. Rs 350 -> 35000).

-- STEP 1: run this alone first. Copy the exact product names it returns.
select id, name, category, price_paise, available, hsn_code, gst_rate
from products
order by category, name;

-- STEP 2: fill in the MRP (in RUPEES) for each product below, using the exact
-- names from step 1, then run from "begin;" to "commit;".
-- It aborts without changing anything if a price is left null, a name does not
-- match, or a product from step 1 is missing from the list.
begin;

create temp table new_prices (name text primary key, mrp_rupees numeric) on commit drop;

insert into new_prices (name, mrp_rupees) values
  ('PRODUCT NAME 1',  null),
  ('PRODUCT NAME 2',  null),
  ('PRODUCT NAME 3',  null),
  ('PRODUCT NAME 4',  null),
  ('PRODUCT NAME 5',  null),
  ('PRODUCT NAME 6',  null),
  ('PRODUCT NAME 7',  null),
  ('PRODUCT NAME 8',  null),
  ('PRODUCT NAME 9',  null),
  ('PRODUCT NAME 10', null),
  ('PRODUCT NAME 11', null);

do $$
begin
  if exists (select 1 from new_prices where mrp_rupees is null or mrp_rupees <= 0) then
    raise exception 'Fill in a positive MRP for every row in new_prices';
  end if;
  if exists (select 1 from new_prices n where not exists (select 1 from products p where p.name = n.name)) then
    raise exception 'A name in new_prices does not match any product: %',
      (select string_agg(n.name, ', ') from new_prices n where not exists (select 1 from products p where p.name = n.name));
  end if;
  if exists (select 1 from products p where not exists (select 1 from new_prices n where n.name = p.name)) then
    raise exception 'Products missing from new_prices: %',
      (select string_agg(p.name, ', ') from products p where not exists (select 1 from new_prices n where n.name = p.name));
  end if;
end $$;

update products p
set price_paise = round(n.mrp_rupees * 100)::integer
from new_prices n
where p.name = n.name;

-- Check the result before committing: price_rupees should match your MRPs.
select name, price_paise, price_paise / 100.0 as price_rupees from products order by category, name;

commit;
