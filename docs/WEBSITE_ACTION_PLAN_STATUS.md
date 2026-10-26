# Website Action Plan: status and change log

Source: `WWY_Website_Action_Plan.pdf` (audit of the dev preview, 21 and 23 Oct 2026).
Branch: `fix/website-action-plan`. Legend: **Done** = finished in code. **Done, needs input** = built, but a fact or decision from the owner is still needed. **Open** = not done, with the reason.

## 1. What you must do before launch (in this order)

1. **Vercel env vars** (Production, Preview, Development):
   - `OMS_SESSION_SECRET`: random string, 32+ characters. Without it nobody can log in to the OMS and the dev preview cannot be unlocked.
   - `DEV_PREVIEW_KEY`: the key for `/?dev=<key>`. There is no default any more.
   - `NEXT_PUBLIC_SITE_URL`: `https://wildwildyeast.com` (used for the sitemap, canonical and Open Graph URLs).
2. **Deploy this branch**, then check the OMS: log in, open orders, edit a product, change a setting, open a baker link and a `/pay` link.
3. **Run SQL in the Supabase SQL Editor, in this order:**
   1. `supabase-plan-migration.sql`: newsletter table, product declaration columns, HSN/GST columns, cutoff setting = 21.
   2. `supabase-fix-prices.sql`: set the real MRPs (fill in the 11 `null` values, in rupees).
   3. `supabase-lock-all.sql`: closes the open database policies. **Only after steps 1 and 2 of this list.**
4. **Test as a customer** after the lock-down: register, log in by email, order history, account (edit phone and address), checkout.
5. **Fill in the business identity** in `src/lib/business.ts` (see section 3). Every empty value shows as "[to be added before launch]" on the site.
6. **Set the same prices in `src/lib/products.ts`** (`price` and `priceNum`), which still say ₹1. `/shop` reads this file, not the database.
7. **Real-money test order** on Razorpay live keys, then refund it (P0-1 "done when").
8. At launch: remove the dev gate (delete the gate section of `src/proxy.ts`) so `/` serves the real homepage and the policy pages are public for Razorpay review.

## 2. Item by item

### P0 Launch blockers

| # | Status | What was done / what is left |
|---|---|---|
| P0-1 prices ₹1 | **Done, needs input** | The price display already divides by 100 correctly. `supabase-fix-prices.sql` is ready with the 11 live product names; it needs your MRPs. `lib/products.ts` needs the same prices. The live-money test order is yours to run. |
| P0-2 browser price | **Done** | `api/orders/initiate` reprices every line from the `products` table, rejects unavailable products and bad quantities, and ignores client prices. |
| P0-3 policy pages | **Done, needs input** | `/privacy`, `/terms`, `/refund`, `/delivery`, `/contact` built and linked in the footer. Draft text, **have it reviewed by your lawyer**. Choices I made that you must confirm: damage reports within **24 hours** with a photo; refunds in **5 to 7 working days**; invoices kept **8 years**; Mumbai courts. Set in `src/lib/business.ts` (`POLICY`) and the page text. |
| P0-4 legal identity | **Done, needs input** | Footer and Contact show Brewad LLP, address, LLPIN, GSTIN, FSSAI, care email and phone, and grievance officer, from `src/lib/business.ts`. The address, LLPIN, GSTIN, FSSAI number, care email and grievance officer are empty: I do not have them. The FSSAI **logo** is not added (needs the official file). Per-SKU manufacturer fields exist in the OMS and show on `/order` cards. |
| P0-5 homepage sells drinks | **Done (D1 = B)** | The live products table has no drinks, so drink content was removed from the homepage, hero, carousel, `/order` page and coming-soon page. Reviews that praise the ales were left in (see "Left as is"). |
| P0-6 fake social proof | **Done (D3 = B)** | Invented handles, products, the duplicate S.P. review and "Verified Buyer" are gone. "Wild Sightings" is now "From our oven": six of your own photos linking to Instagram. **You still need written OK from each named reviewer.** |

### P1 Claims and compliance copy

| # | Status | Notes |
|---|---|---|
| P1-1 probiotic / alive | **Done** | Removed from the homepage, `/order`, Story, hero and starter wording. |
| P1-2 "100% Natural", "Zero Artificial Additives" | **Done** | Replaced with "12 to 24 hrs Fermentation" and "0 Commercial yeast" (C3, C4). "No preservatives" is not claimed anywhere. |
| P1-3 title and meta | **Done** | Title is "Wild Wild Yeast \| Sourdough, Mumbai" and the description is the C2 text without "ginger ale". Switch to C1/C2 as written once ferments are listed (D1). |
| P1-4 fermentation continues | **Done** | C11. |
| P1-5 outsourced process claims | **Partly done, needs input** | I removed "stone-baked" and "scored by hand" wording on the homepage process steps. **Confirm with the baking partner** in writing: hand scoring, stone deck oven, sea salt. `lib/products.ts` still says "Hand-scored" for the Classic Heritage loaf. |
| P1-6 brand brief | **Done** | The three lines are gone. |
| P1-7 "Living food" | **Done** | Marquee now says BAKED TO ORDER (C10). |
| P1-8 Priya T review | **Decision for you** | Left as is. It credits "every bake from Dnyanesh". Keep it or drop the review. |

### P2 Contradictions and broken flow

| # | Status | Notes |
|---|---|---|
| P2-1 cutoffs | **Done** | New `src/lib/schedule.ts` is the single source. The resolver (`lib/dateUtils.ts`) now closes orders **2 days before the delivery day at 9 PM**: 9 PM Monday for Wednesday, 9 PM Thursday for Saturday. The old code cut off at noon the day before. Tested on 7 date cases. Banner, Story, policy pages and checkout use the same rule. The migration sets the OMS setting `cutoff_hour_ist` to 21; **if you change it later, the written copy (which uses the defaults) will disagree**. |
| P2-2 drinks lead time | **N/A under D1 = B** | Drinks are hidden. Revisit when ferments launch. |
| P2-3 croissants 48 hours | **Done (the "drop the line" option)** | Removed the 48-hour line. A separate croissant cutoff enforced in the cart was **not** built. |
| P2-4 "weekly cutoff" | **Done** | C19, C20. |
| P2-5 phantom products | **Done** | The lead-time table now lists only sourdough and breads, croissants and Be-Sides. |
| P2-6 login identifier | **Open (D2)** | Email OTP login is unchanged. Moving to phone plus WhatsApp OTP (Twilio) is a separate project: it changes auth, the customer key and the RLS policies. |
| P2-7 dead CTAs | **Done** | "Shop the Set" is "See the menu"; the drag line and the "journal" line are replaced (C8, C9, C22); "How It Works" now links to the section. |
| P2-8 two catalogues | **Partly done** | `/shop` is the indexable catalogue (canonical, product data, in nav). `/order` is marked noindex with `/shop` as canonical. Ordering still happens on `/order` because it holds the cart and the database prices. Merging them is a larger rebuild. |
| P2-9 timeline facts | **Needs input** | I cannot verify the 2019, 2021 and 2023 entries. The 2023 "Soda Experiments" entry is unchanged. |
| P2-10 cart copy | **Done** | C26. |

### P3 Additions

| # | Status | Notes |
|---|---|---|
| P3-1 declarations | **Done, needs input** | New columns (migration), OMS product form fields, and an expandable "Product details" panel on `/order` and `/shop`. The values (ingredients, allergens, net quantity, best before, storage) are for you to enter. Fields render only if set. |
| P3-2 flavours | **Done** | "Flavours we bake" block on `/shop` with the five flavours from your reviews. Edit the list in `app/shop/page.tsx`. |
| P3-3 gifting | **Done, needs input** | `/gifting` with four draft tiers and a WhatsApp enquiry form. **Tier contents are my draft and prices say "Price on enquiry"**: edit `src/lib/gifting.ts`. |
| P3-4 pincode check | **Done** | On `/shop` and `/delivery`. Not added to the banner. |
| P3-5 live countdown | **Done** | Banner counts down to the next cutoff using the OMS settings. |
| P3-6 newsletter | **Done (D4 = A, partly)** | WhatsApp number plus a consent box, stored in `newsletter_signups`. The **Interakt connection is not built**: export the table or connect Interakt later. |
| P3-7 alt text and imagery | **Partly done** | Placeholder alt text replaced. `f1.png` and `f2.png` look like stock or AI images, and `p1.png` to `p4.png` are drink cans. **The real photo shoot is yours.** |
| P3-8 per-page metadata | **Done** | Titles, descriptions, Open Graph, Twitter card, `Bakery` and `Product` structured data. The Open Graph image is the Dutch oven loaf. Product offers are left out until a product has a real price. |
| P3-9 spelling | **Done** | C16. Confirm macaroons (coconut) versus macarons (almond). |
| P3-10 em dashes | **Done** | All removed from site copy, emails and invoices. **Customer review quotes were not edited**, so a search for "—" still finds them. |

### P4 Technical and security

| # | Status | Notes |
|---|---|---|
| P4-1 dev gate | **Done** | Signed, expiring cookie. `DEV_PREVIEW_KEY` has no default. Remove at launch. |
| P4-2 admin endpoints | **Done** | The OMS login now issues a signed 12-hour token. Forged cookies get 401. Tested. |
| P4-3 anon key and RLS | **Done in SQL, not yet run** | `supabase-lock-all.sql`. The live `products` table had an open write policy before this. |
| P4-4 robots and sitemap | **Done** | `/robots.txt` and `/sitemap.xml` return 200 and bypass the gate. |
| P4-5 coming-soon redirect | **Done** | `/` is a rewrite (200), "2026 / 01" removed, drink wording removed. |

## 3. Security work done alongside the plan

- Server-side price recomputation at checkout.
- All OMS database access goes through an admin-only server route (`/api/oms/db`); the OMS pages no longer talk to the database from the browser.
- Baker dashboard, pay page, pincode check and vacation flag moved to server routes.
- Customer pages work through database policies tied to the customer's email login.
- `supabase-lock-all.sql` removes every open policy and strips browser privileges; only `products` stays publicly readable.

## 4. Left as is, on purpose

- **Customer reviews** are unedited, including four that praise ginger ales and quotes containing dashes.
- **"Naturally leavened"** stays in the marquee and on bread descriptions (the plan's own C10 keeps it). A search for "natural" will still match.
- **The `/journal` pages** (drafts that claimed "living food" and described the drinks) now redirect to `/story`. The text is still in `src/lib/journal.ts` and in git history.
- **`/order/confirm` and `/order-confirmation`** still say "entered fermentation". The plan did not flag them.
- **Internal dashboards** (OMS, baker page) and server logs were not touched.

## 5. Not covered by the audit and not checked here

Checkout and payment screens behind login, mobile layout, page speed, the `invoices` storage bucket being public, and a real photo shoot.

## 6. Launch-day checks (from the plan)

- Real-money order at full price, then refund (P0-1, P0-2).
- All five policy pages return 200 and appear in the footer (P0-3).
- Footer shows Brewad LLP, address, LLPIN, GSTIN, FSSAI number and logo, and the grievance officer (P0-4). Run `listMissingBusinessFields()` from `src/lib/business.ts` to see what is still empty.
- Search the live HTML for: probiotic, 100%, natural, pure, alive, living, "—". Expect zero hits in site copy (apart from the items in section 4).
- Logged-out calls to `/api/oms/*` return 401 (P4-2).
- Anon-key read of customer and order tables returns nothing (P4-3).
- Share `/` and `/shop` on WhatsApp; both show a correct card (P3-8).
- Dev gate removed; `robots.txt` and `sitemap.xml` live (P4-1, P4-4).
