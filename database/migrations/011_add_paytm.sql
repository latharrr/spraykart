-- Add Paytm columns and payment gateway marker
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paytm_txn_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(20) DEFAULT 'razorpay';
