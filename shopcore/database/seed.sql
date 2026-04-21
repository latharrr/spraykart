-- ─── Spraykart Seed Data ─────────────────────────────────────────────────────
-- Run AFTER schema.sql on your Supabase SQL editor

-- ─── Admin User ───────────────────────────────────────────────────────────────
-- Password: admin123
INSERT INTO users (name, email, password, role) VALUES
  ('Admin', 'admin@spraykart.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8FIFAr6c5p.VfJ.Mz5O', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Customers — Password: password123
INSERT INTO users (name, email, password) VALUES
  ('Ananya Sharma', 'ananya@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8FIFAr6c5p.VfJ.Mz5O'),
  ('Rahul Mehta',   'rahul@example.com',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8FIFAr6c5p.VfJ.Mz5O')
ON CONFLICT (email) DO NOTHING;

-- ─── Products ─────────────────────────────────────────────────────────────────
INSERT INTO products (name, slug, description, price, compare_price, stock, category, is_featured, is_active, meta_title, meta_description) VALUES

  -- Men's fragrances
  ('Creed Aventus', 'creed-aventus',
   'The ultimate power fragrance for men. A sophisticated blend of blackcurrant, bergamot, apple, pineapple, birch, musk, oakmoss and ambergris. Iconic, long-lasting, and unmistakable.',
   18500, 24000, 45, 'Men', true, true,
   'Buy Creed Aventus Perfume Online India | Spraykart',
   '100% authentic Creed Aventus. Premium men''s fragrance with blackcurrant & birch. GST invoice included.'),

  ('Dior Sauvage EDP', 'dior-sauvage-edp',
   'A radically fresh composition that''s both refined and wild. Bergamot, pepper, lavender, geranium, vetiver, patchouli and ambergris create a powerful masculine sillage.',
   8200, 9500, 80, 'Men', true, true,
   'Buy Dior Sauvage EDP Online India | Spraykart',
   '100% authentic Dior Sauvage EDP. Best price in India with GST invoice.'),

  ('Bleu de Chanel EDP', 'bleu-de-chanel-edp',
   'A woody aromatic fragrance for the man who defies conventions. Citrus, incense, labdanum and sandalwood create an aura of absolute freedom.',
   9800, 12000, 60, 'Men', true, true,
   'Buy Bleu de Chanel EDP India | Spraykart',
   'Authentic Bleu de Chanel EDP at best price in India.'),

  ('Versace Eros EDP', 'versace-eros-edp',
   'A seductive, bold fragrance inspired by the Greek god of love. Mint, green apple, tonka bean, ambroxan — made for the passionate, modern man.',
   4200, 5800, 120, 'Men', false, true,
   'Buy Versace Eros EDP Online India | Spraykart',
   'Authentic Versace Eros EDP at the best price with fast delivery.'),

  -- Women's fragrances
  ('Chanel No. 5 EDP', 'chanel-no-5-edp',
   'The world''s most famous fragrance. An abstract floral aldehyde with notes of ylang ylang, rose, jasmine, iris, sandalwood and vanilla. Timeless femininity.',
   12500, 15000, 35, 'Women', true, true,
   'Buy Chanel No. 5 EDP Online India | Spraykart',
   '100% authentic Chanel No. 5 EDP. Luxury women''s fragrance at best price in India.'),

  ('YSL Black Opium EDP', 'ysl-black-opium-edp',
   'A daring, sensual fragrance for women. Coffee, white flowers, vanilla and a touch of patchouli create an addictive, irresistible signature.',
   7200, 8500, 55, 'Women', true, true,
   'Buy YSL Black Opium EDP India | Spraykart',
   'Authentic YSL Black Opium EDP at best price. GST invoice provided.'),

  ('Lancôme La Vie Est Belle', 'lancome-la-vie-est-belle',
   'The fragrance of happiness. Iris, patchouli, gourmand praline and vanilla create an optimistic, joyful signature made for every woman.',
   6800, 8200, 70, 'Women', false, true,
   'Buy Lancôme La Vie Est Belle Online India | Spraykart',
   'Authentic La Vie Est Belle EDP. Best price in India with 2-day delivery.'),

  -- Unisex
  ('Tom Ford Oud Wood', 'tom-ford-oud-wood',
   'A smooth, sophisticated take on oud. Rare oud wood, sandalwood, tonka bean, vetiver and amber — refined and genderless. A true collector''s fragrance.',
   22000, 28000, 20, 'Unisex', true, true,
   'Buy Tom Ford Oud Wood Online India | Spraykart',
   '100% authentic Tom Ford Oud Wood at best price in India.'),

  ('Maison Margiela Replica — Jazz Club', 'mm-replica-jazz-club',
   'Inspired by a smoky jazz club at midnight. Rum, pink pepper, vetiver, tobacco leaves and musk — instantly transporting and addictive.',
   9200, 11000, 40, 'Unisex', true, true,
   'Buy Maison Margiela Replica Jazz Club India | Spraykart',
   'Authentic Replica Jazz Club at best price. Free shipping on orders above ₹999.'),

  -- Attar
  ('Royal Oud Attar', 'royal-oud-attar',
   'Pure, handcrafted Indian attar. A blend of aged oud and rose absolute — alcohol-free, long-lasting, and deeply sensual. Suitable for sensitive skin.',
   3200, 4500, 150, 'Attar', true, true,
   'Buy Pure Royal Oud Attar Online India | Spraykart',
   'Pure alcohol-free Royal Oud attar. Handcrafted. 100% authentic. Delivered pan-India.'),

  ('Musk Al Tahara', 'musk-al-tahara',
   'The classic pure white musk attar, loved for its clean, fresh, skin-like scent. Alcohol-free, halal-certified, and extremely long-lasting.',
   1200, 1800, 200, 'Attar', false, true,
   'Buy Musk Al Tahara Attar Online India | Spraykart',
   'Pure Musk Al Tahara — clean, alcohol-free attar at best price.'),

  -- Gift Sets
  ('Spraykart Discovery Set — Premium', 'spraykart-discovery-set',
   'An expertly curated discovery set of 6 × 5ml vials from our premium collection. Includes Men, Women, and Unisex options. Beautifully gift-boxed — perfect for gifting.',
   2800, 3500, 100, 'Gift Sets', true, true,
   'Buy Luxury Fragrance Discovery Gift Set India | Spraykart',
   'Curated luxury fragrance discovery set. 6 × 5ml vials. Perfect gift. Free premium gift wrap.')

ON CONFLICT (slug) DO NOTHING;

-- ─── Coupons ──────────────────────────────────────────────────────────────────
INSERT INTO coupons (code, type, value, min_order, max_uses, is_active) VALUES
  ('WELCOME10', 'percentage', 10, 999,  1000, true),
  ('FIRST500',  'flat',       500, 2999, 500,  true),
  ('LUXURY20',  'percentage', 20, 4999, 200,  true)
ON CONFLICT DO NOTHING;
