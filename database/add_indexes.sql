-- SprayKart Production Database Indexes
-- Improves performance for high-traffic operations and webhook handling

-- 1. Razorpay Webhook lookups (CRITICAL)
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key ON orders(idempotency_key);

-- 2. User Authentication
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. Order relationships (speeds up joins)
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- 4. Review lookups
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);

-- 5. Product Image lookups
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- 6. Variants lookups
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON variants(product_id);

-- 7. Password resets lookups
CREATE INDEX IF NOT EXISTS idx_password_resets_email_otp ON password_resets(email, otp, expires_at);
