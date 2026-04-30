-- Migration: Add phone to users + create faqs table
-- Run this against your PostgreSQL database

-- 1. Add phone column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(15);

-- 2. Add index for phone search
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;

-- 3. Create FAQs table
CREATE TABLE IF NOT EXISTS faqs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  image_url   TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Seed some default FAQs
INSERT INTO faqs (question, answer, sort_order) VALUES
  ('Are your fragrances 100% authentic?', 'Yes, absolutely. Every product on Spraykart is 100% authentic and sourced directly from authorized distributors. We provide a full authenticity guarantee with every order.', 1),
  ('How long does shipping take?', 'Standard delivery takes 4–7 business days across India. We offer free shipping on all orders above ₹999. Once shipped, you will receive a tracking link via SMS and email.', 2),
  ('Can I return a fragrance?', 'We accept returns within 7 days of delivery if the product is unused, sealed, and in its original packaging. Opened or used fragrances cannot be returned due to hygiene reasons.', 3),
  ('Do you offer Cash on Delivery (COD)?', 'Yes! COD is available on orders up to ₹2,999. Simply select "Cash on Delivery" at checkout.', 4),
  ('How do I track my order?', 'Go to My Orders in your account dashboard and click "Track Order" on any order to see the live status — from confirmation through to delivery.', 5),
  ('What payment methods do you accept?', 'We accept all major credit/debit cards, UPI, net banking, and wallets via Razorpay. All transactions are secured with industry-standard SSL encryption.', 6)
ON CONFLICT DO NOTHING;
