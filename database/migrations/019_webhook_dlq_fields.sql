ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'processing';
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS last_error TEXT;
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS retry_count INT NOT NULL DEFAULT 0;
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_webhook_events_status
  ON webhook_events(status, created_at DESC);
