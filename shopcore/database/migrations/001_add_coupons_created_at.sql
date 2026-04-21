-- Migration: add created_at to coupons table
-- Run this in Supabase SQL Editor if the table already exists without created_at

ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
