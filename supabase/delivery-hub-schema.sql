-- ═══════════════════════════════════════════════════════════════
-- FASHIONVERSE DELIVERY HUB — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── COURIER COMPANIES TABLE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS courier_companies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  logo_url        text,
  brand_color     text DEFAULT '#00C853',
  commission_rate numeric DEFAULT 15,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

-- ── SEED 10 COMPANIES ────────────────────────────────────────
INSERT INTO courier_companies (name, logo_url, brand_color) VALUES
('Shadowfax',    'https://logo.clearbit.com/shadowfax.in',     '#6C3BEB'),
('Borzo',        'https://logo.clearbit.com/borzo.com',         '#FF6B00'),
('Porter',       'https://logo.clearbit.com/porter.in',         '#F7B731'),
('Dunzo',        'https://logo.clearbit.com/dunzo.com',         '#00C853'),
('Delhivery',    'https://logo.clearbit.com/delhivery.com',     '#E31837'),
('Ecom Express', 'https://logo.clearbit.com/ecomexpress.in',    '#0056A2'),
('Xpressbees',   'https://logo.clearbit.com/xpressbees.com',    '#FF6600'),
('Shiprocket',   'https://logo.clearbit.com/shiprocket.in',     '#F7C325'),
('Bluedart',     'https://logo.clearbit.com/bluedart.com',      '#003366'),
('WeFast',       'https://logo.clearbit.com/wefast.com',        '#FF3D00')
ON CONFLICT DO NOTHING;

-- ── DRIVER EARNINGS TABLE ────────────────────────────────────
CREATE TABLE IF NOT EXISTS driver_earnings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id   uuid,
  delivery_id uuid,
  company_id  uuid REFERENCES courier_companies(id),
  amount      numeric NOT NULL,
  earned_at   timestamptz DEFAULT now()
);
