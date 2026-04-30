-- Add paytm_order_id column to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paytm_order_id TEXT;
