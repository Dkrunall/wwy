-- Run this in Supabase SQL Editor AFTER the initial schema

-- ─── Orders: add new columns ────────────────────────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number        TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status      TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_status     TEXT DEFAULT 'placed';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date       DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id   TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_url         TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS baker_id            UUID;

-- ─── Customers: add contact fields ──────────────────────────────────────────
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS pincode TEXT;

-- ─── Settings table ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);
INSERT INTO settings (key, value) VALUES ('vacation_mode', 'false') ON CONFLICT DO NOTHING;

-- ─── Bakers table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bakers (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT    NOT NULL,
  phone          TEXT    NOT NULL,
  pincodes       TEXT[]  DEFAULT '{}',
  daily_capacity INTEGER DEFAULT 20,
  is_active      BOOLEAN DEFAULT true,
  share_token    TEXT    UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── WhatsApp sessions (for the bot flow) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  phone      TEXT PRIMARY KEY,
  step       TEXT    DEFAULT 'identify',
  cart       JSONB   DEFAULT '[]',
  temp       JSONB   DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RLS for new tables ─────────────────────────────────────────────────────
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bakers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_all" ON settings FOR ALL USING (true);
CREATE POLICY "bakers_all"   ON bakers   FOR ALL USING (true);
CREATE POLICY "sessions_all" ON sessions FOR ALL USING (true);

-- ─── Orders: admin notes (added post-launch) ────────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- ─── Feedbacks table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedbacks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID REFERENCES orders(id) ON DELETE CASCADE,
  flat_number TEXT NOT NULL,
  rating      INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (order_id)
);

ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feedbacks_all" ON feedbacks FOR ALL USING (true);

-- ─── Orders: source channel ──────────────────────────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web';

-- ─── Customers: email for OTP login ─────────────────────────────────────────
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- ─── Borzo delivery integration ──────────────────────────────────────────────
ALTER TABLE bakers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE bakers ADD COLUMN IF NOT EXISTS lat     FLOAT8;
ALTER TABLE bakers ADD COLUMN IF NOT EXISTS lng     FLOAT8;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS borzo_order_id     TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS borzo_tracking_url TEXT;

-- ─── Customers: flat number is not globally unique ──────────────────────────
-- Multiple customers can legitimately share a flat number (roommates/family
-- using the same OMS, or the same flat number existing in a different
-- building). Email (via OTP login) is the real identity now.
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_flat_number_key;

-- ─── Orders: shipping fee (added 2026-08-15) ────────────────────────────────
-- Free shipping at/above ₹599 subtotal, flat ₹65 standard fee below it.
-- total_paise already includes this fee; kept separately so invoices/OMS can
-- break out the line item and so the loyalty-discount % calc isn't thrown off.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee_paise INTEGER NOT NULL DEFAULT 0;

-- ─── Products: image upload from OMS product form ───────────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- NOTE: also create a Storage bucket named "product-images" in the Supabase
-- dashboard (Storage → New bucket → Public), same as the existing "invoices"
-- bucket. The OMS upload route uses the service-role key server-side, so no
-- extra storage policy is required.
