# Spraykart — Performance Optimisation Guide

## What was slow and why

| Issue | Impact | Fix |
|-------|--------|-----|
| Google Fonts via CSS `@import` | **#1 — blocks render** | `next/font/google` in `layout.jsx` |
| No `loading.jsx` files | Blank white screen on navigation | Added for `/`, `/products`, `/admin`, `/orders` |
| No `priority` on above-fold images | LCP delayed by 2-4s | `priority={i < 4}` on first 4 ProductCards |
| No image format config | PNG/JPG instead of AVIF/WebP | `formats: ['image/avif', 'image/webp']` in `next.config.js` |
| DB cold starts (min: 0) | First request takes 1-3s | `min: 2` connections kept warm at all times |
| No in-memory cache fallback | Every request hits DB if Redis absent | LRU in-memory tier added to `cache.js` |
| No `compress: true` | Responses not gzip/brotli'd | Added to `next.config.js` |
| No HTTP cache headers | Static assets refetched every load | Immutable headers for `/_next/static/*` |
| `lucide-react` full bundle | ~400KB unnecessary icons | `optimizePackageImports` in experimental config |
| Navbar hover dropdown (CSS) | Broken on touch devices + re-renders | Click-based with `useCallback`, `memo` |
| ProductCard re-renders on parent state | Wasted paints on cart updates | `React.memo` wrapping |
| `useSearchParams` in Navbar not suspended | Hydration warning | Already had Suspense, now cleaned up |
| useFetch no abort | Stale data on fast navigation | `AbortController` added |
| `revalidate` missing on homepage | Full DB hit per request | `export const revalidate = 300` |

---

## Files to replace (drop-in)

```
next.config.js                          → next.config.js
app/layout.jsx                          → app/layout.jsx
app/globals.css                         → app/globals.css
app/page.jsx                            → app/page.jsx
lib/db.js                               → lib/db.js
lib/cache.js                            → lib/cache.js
lib/hooks/useFetch.js                   → lib/hooks/useFetch.js
components/product/ProductCard.jsx      → components/product/ProductCard.jsx
components/layout/Navbar.jsx            → components/layout/Navbar.jsx
```

## New files to create

```
app/loading.jsx                         → root loading skeleton
app/products/loading.jsx                → /products skeleton
app/admin/loading.jsx                   → /admin skeleton
app/orders/loading.jsx                  → /orders skeleton
```

---

## Expected gains

| Metric | Before | After |
|--------|--------|-------|
| FCP (First Contentful Paint) | ~3-4s | <1s |
| LCP (Largest Contentful Paint) | ~8-12s | <2.5s |
| TTI (Time to Interactive) | ~10s+ | <3s |
| Perceived navigation speed | Blank flash | Instant skeleton |
| Font flash (FOUT) | Yes | None |
| JS bundle (initial) | ~450KB | ~310KB |

---

## Cloudinary image tip (bonus)

Add these transforms to your Cloudinary upload URL for instant WebP + compression:

```js
// lib/cloudinary.js — in uploadImage()
transformation: [{ 
  width: 1200, height: 1200, crop: 'limit', 
  quality: 'auto:good',
  fetch_format: 'auto',   // serves WebP/AVIF automatically
}],
```

---

## Database indexes (run once in Supabase SQL editor)

```sql
-- Speeds up featured products query on homepage
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_featured_active
  ON products (is_featured, is_active, created_at DESC);

-- Speeds up product slug lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_slug
  ON products (slug) WHERE is_active = true;

-- Speeds up order listings
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_created
  ON orders (user_id, created_at DESC);

-- Speeds up approved reviews join
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_product_approved
  ON reviews (product_id, is_approved);
```
