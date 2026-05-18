-- Add password_changed_at to invalidate JWTs issued before a password reset.
-- Tokens with iat < password_changed_at are rejected by getAuthUser.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
