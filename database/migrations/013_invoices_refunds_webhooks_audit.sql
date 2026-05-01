-- Pre-production hardening tables and tax snapshot fields.

ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_code TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5,2) DEFAULT 18;

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS hsn_code TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5,2) DEFAULT 18;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS reserved_until TIMESTAMPTZ;

CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1001;

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
