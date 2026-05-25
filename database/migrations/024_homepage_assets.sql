CREATE TABLE IF NOT EXISTS homepage_assets (
  key TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  public_id TEXT,
  alt TEXT,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
