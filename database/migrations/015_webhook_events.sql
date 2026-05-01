CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT,
  payload JSONB,
  status TEXT NOT NULL DEFAULT 'processing',
  last_error TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  event_key TEXT UNIQUE,
  UNIQUE(provider, event_id)
);

ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS event_id TEXT;
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS event_type TEXT;
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS payload JSONB;
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'processing';
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS last_error TEXT;
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0;
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS event_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_provider_event_id ON webhook_events(provider, event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status, created_at DESC);
