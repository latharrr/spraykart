ALTER TABLE order_items ADD COLUMN IF NOT EXISTS reserved_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_order_items_reserved_until
  ON order_items(reserved_until)
  WHERE reserved_until IS NOT NULL;
