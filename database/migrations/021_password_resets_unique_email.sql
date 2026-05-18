-- Migration: enforce one password_reset row per email
-- Required for the UPSERT (ON CONFLICT email) pattern used by /api/auth/forgot-password.
-- Without this, concurrent forgot-password requests could leave multiple rows
-- for the same email, breaking attempts-counting and letting OTPs race.

-- Delete duplicates, keeping the most recent row per email
DELETE FROM password_resets a
USING password_resets b
WHERE a.email = b.email
  AND a.created_at < b.created_at;

ALTER TABLE password_resets
  ADD CONSTRAINT password_resets_email_unique UNIQUE (email);
