-- FRAGRANCE FINDER SUBMISSIONS
CREATE TABLE IF NOT EXISTS fragrance_finder_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fragrance_finder_submissions_created_at
  ON fragrance_finder_submissions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fragrance_finder_submissions_user
  ON fragrance_finder_submissions(user_id);