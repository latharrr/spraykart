-- ============================================================
--  Spraykart Production — Performance Indexes
--  Paste ALL at once into the Supabase SQL editor and run.
--  (CONCURRENTLY removed — not allowed inside a transaction block)
-- ============================================================

-- 1. Featured products listing (homepage)
CREATE INDEX IF NOT EXISTS idx_products_featured_active
  ON products (is_featured, is_active, created_at DESC);

-- 2. Product detail lookup by slug
CREATE INDEX IF NOT EXISTS idx_products_slug_active
  ON products (slug) WHERE is_active = true;

-- 3. Order history per user
CREATE INDEX IF NOT EXISTS idx_orders_user_created
  ON orders (user_id, created_at DESC);

-- 4. Approved reviews per product
CREATE INDEX IF NOT EXISTS idx_reviews_product_approved
  ON reviews (product_id, is_approved);

-- 5. FK: product_images → products  (Postgres doesn't auto-create FK indexes)
CREATE INDEX IF NOT EXISTS idx_product_images_product_id
  ON product_images (product_id);

-- 6. FK: order_items → orders
CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON order_items (order_id);

-- 7. FK: order_items → products
CREATE INDEX IF NOT EXISTS idx_order_items_product_id
  ON order_items (product_id);

-- ============================================================
--  Verify with:
--  SELECT indexname, tablename FROM pg_indexes
--  WHERE indexname LIKE 'idx_%'
--  ORDER BY tablename, indexname;
-- ============================================================
