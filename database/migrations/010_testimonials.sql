-- Create testimonials table for homepage "Loved Across India" section
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  location VARCHAR(150),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  review TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_sort_order
  ON testimonials(sort_order, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_testimonials_active
  ON testimonials(is_active);
