-- Migration: add applicable_products to coupons table
-- Run in Supabase SQL Editor

ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS applicable_products UUID[] DEFAULT NULL;

-- NULL means "applies to all products"
-- Non-empty array means "only applies to these product IDs"
