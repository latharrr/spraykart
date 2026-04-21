-- Migration: password_resets table for OTP-based password reset
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS password_resets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      VARCHAR(150) NOT NULL,
  otp        VARCHAR(6)   NOT NULL,
  expires_at TIMESTAMPTZ  NOT NULL,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);

-- Migration: COD support on orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'online';
-- Values: 'online' (Razorpay) | 'cod' (Cash on Delivery)
