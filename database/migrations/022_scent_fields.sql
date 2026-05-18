-- Add scent profile fields to products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS top_notes     TEXT,
  ADD COLUMN IF NOT EXISTS heart_notes   TEXT,
  ADD COLUMN IF NOT EXISTS base_notes    TEXT,
  ADD COLUMN IF NOT EXISTS scent_family  VARCHAR(100),
  ADD COLUMN IF NOT EXISTS longevity     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS sillage       VARCHAR(100),
  ADD COLUMN IF NOT EXISTS season        VARCHAR(200),
  ADD COLUMN IF NOT EXISTS occasion      VARCHAR(200),
  ADD COLUMN IF NOT EXISTS brand         VARCHAR(200);

-- Leads table for email capture
CREATE TABLE IF NOT EXISTS leads (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  source     TEXT NOT NULL DEFAULT 'exit_intent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
