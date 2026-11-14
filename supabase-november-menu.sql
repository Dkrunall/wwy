-- November 2026 menu: real prices, ingredients and allergens. Safe to re-run.
-- Run in the Supabase SQL Editor (choose "Run without RLS" if asked: it only creates a temp table).

-- 1. Rename the old rows so their photos and descriptions carry over.
update products set name = 'Classic Sourdough'     where name = 'Sourdough Classic Heritage';
update products set name = 'Sourdough Ladi Pav'    where name = 'Sourdough Laadi Pav';
update products set name = 'Sourdough Burger Buns' where name = 'Sourdough Buns';
update products set name = 'Plain Croissant'       where name = 'Croissant';

-- 2. The November products.
drop table if exists november_menu;
create temp table november_menu (name text, price_paise integer, ingredients text, allergens text);
insert into november_menu values
  ('Classic Sourdough', 32000, 'Refined wheat flour (bread flour), water, whole wheat flour, sourdough starter (refined wheat flour, water), salt', 'Wheat (gluten)'),
  ('Sourdough Ladi Pav', 18000, 'Refined wheat flour (bread flour), water, sourdough starter (refined wheat flour, water), butter (milk), sugar, salt', 'Wheat (gluten), milk'),
  ('Sourdough Burger Buns', 20000, 'Refined wheat flour (bread flour), milk, sourdough starter (refined wheat flour, water), butter (milk), sugar, sesame seeds, salt', 'Wheat (gluten), milk, sesame'),
  ('Podi & Cheese Sourdough', 35000, 'Refined wheat flour (bread flour), water, whole wheat flour, cheese (milk), sourdough starter (refined wheat flour, water), podi (split black gram, split Bengal gram, dried red chilli, sesame seeds, curry leaves, asafoetida, salt), salt', 'Wheat (gluten), milk, sesame'),
  ('Plain Croissant', 32500, 'Refined wheat flour (bread flour), butter (milk), milk, water, sourdough starter (refined wheat flour, water), sugar, salt', 'Wheat (gluten), milk'),
  ('Roasted Garlic & Chilli Flakes Sourdough', 35000, 'Refined wheat flour (bread flour), water, whole wheat flour, sourdough starter (refined wheat flour, water), roasted garlic, olive oil, chilli flakes, salt', 'Wheat (gluten)'),
  ('Pista & Cranberry Babka', 37500, 'Refined wheat flour (bread flour), milk, butter (milk), sugar, sourdough starter (refined wheat flour, water), pistachios, dried cranberries (cranberries, sugar, sunflower oil), salt', 'Wheat (gluten), milk, pistachio (tree nut)'),
  ('Chakli Masala Sourdough', 35000, 'Refined wheat flour (bread flour), water, whole wheat flour, sourdough starter (refined wheat flour, water), chakli masala (rice, Bengal gram, black gram, coriander, cumin, red chilli, sesame seeds, carom seeds, turmeric, asafoetida), salt', 'Wheat (gluten), sesame'),
  ('Chimichurri & Mushroom Sourdough', 37500, 'Refined wheat flour (bread flour), water, mushrooms, whole wheat flour, sourdough starter (refined wheat flour, water), chimichurri (olive oil, parsley, garlic, vinegar, oregano, chilli flakes, salt), salt', 'Wheat (gluten)'),
  ('Besan Laddoo Babka', 35000, 'Refined wheat flour (bread flour), milk, gram flour, ghee (milk), sugar, butter (milk), sourdough starter (refined wheat flour, water), cardamom, salt', 'Wheat (gluten), milk'),
  ('Chana Masala Sourdough', 37500, 'Refined wheat flour (bread flour), water, boiled chickpeas, whole wheat flour, sourdough starter (refined wheat flour, water), onion, sunflower oil, chana masala (coriander, cumin, red chilli, dry mango powder, black pepper, cinnamon, clove, dried fenugreek leaves), coriander leaves, salt', 'Wheat (gluten)'),
  ('Lasun Chutney & Cheese Sourdough', 35000, 'Refined wheat flour (bread flour), water, whole wheat flour, cheese (milk), sourdough starter (refined wheat flour, water), lasun chutney (garlic, dry coconut, red chilli powder, salt), salt', 'Wheat (gluten), milk'),
  ('Cinnamon Maple Focaccia', 37500, 'Refined wheat flour (bread flour), water, sourdough starter (refined wheat flour, water), olive oil, maple syrup, brown sugar, cinnamon, salt', 'Wheat (gluten)'),
  ('Zhunka Bhakri Sourdough', 37500, 'Refined wheat flour (bread flour), water, sorghum (jowar) flour, sourdough starter (refined wheat flour, water), zhunka (gram flour, onion, sunflower oil, garlic, green chilli, mustard seeds, cumin, turmeric, curry leaves, asafoetida), salt', 'Wheat (gluten), mustard'),
  ('Mysore Paneer Masala Sourdough', 37500, 'Refined wheat flour (bread flour), water, paneer (milk), whole wheat flour, sourdough starter (refined wheat flour, water), Mysore masala (onion, dried red chilli, garlic, Bengal gram, tamarind, sunflower oil, curry leaves), salt', 'Wheat (gluten), milk'),
  ('Pain au Chocolat', 40000, 'Refined wheat flour (bread flour), butter (milk), milk, dark chocolate (sugar, cocoa mass, cocoa butter, emulsifier (soy lecithin, INS 322), vanilla), water, sourdough starter (refined wheat flour, water), sugar, salt', 'Wheat (gluten), milk, soy');

insert into products (name, category, price_paise, available)
select m.name, 'Crafted Bakes', m.price_paise, true
from november_menu m
where not exists (select 1 from products p where p.name = m.name);

update products p
set price_paise = m.price_paise, ingredients = m.ingredients, allergens = m.allergens, available = true
from november_menu m
where p.name = m.name;

-- 3. Hide products that are not on the November menu. Delete this block to keep them on sale.
update products set available = false
where name in ('Savoury Sourdough', 'Sweet Sourdough', 'Sourdough Pita Bread', 'Biscotti', 'Macaroons', 'Cookies', 'Crackers');

-- Check: should list the 16 November products.
select name, price_paise / 100 as price_rupees, available from products where available order by name;
