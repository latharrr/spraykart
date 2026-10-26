import db from './db';
import cache from './cache';
import { hasUsableDatabaseUrl } from './env';
import { NICHE_HOUSES } from './houses';

// Shared product listing query for the /products page (server-rendered) and /api/products.

export const SORTS = {
  newest: 'p.created_at DESC',
  'price-asc': 'p.price ASC',
  'price-desc': 'p.price DESC',
  rating: 'avg_rating DESC, review_count DESC, p.created_at DESC',
  bestselling: 'units_sold DESC, p.created_at DESC',
  name: 'p.name ASC',
};

// Legacy "field:ORDER" and field+order pairs map onto the named sorts.
export function normaliseSort(sort, order) {
  if (SORTS[sort]) return sort;
  const [field, dir = order] = String(sort || '').split(':');
  if (field === 'price') return String(dir).toUpperCase() === 'ASC' ? 'price-asc' : 'price-desc';
  if (field === 'name') return 'name';
  if (field === 'sold') return 'bestselling';
  return 'newest';
}

const list = (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean);

export function readListingParams(sp) {
  const get = (k) => (typeof sp.get === 'function' ? sp.get(k) : sp[k]) || '';
  return {
    category: get('category'),
    tier: ['designer', 'niche'].includes(get('tier')) ? get('tier') : '',
    search: get('search'),
    sort: normaliseSort(get('sort'), get('order')),
    page: Math.max(1, parseInt(get('page') || '1', 10) || 1),
    limit: Math.min(Math.max(parseInt(get('limit') || '24', 10) || 24, 1), 100),
    priceMin: get('price_min') || get('min_price'),
    priceMax: get('price_max') || get('max_price'),
    featured: get('is_featured'),
    inStock: get('in_stock') === 'true' || get('availability') === 'in_stock',
    brands: list(get('brand')),
    notes: list(get('note')),
    occasions: list(get('occasion')),
  };
}

export async function listProducts(q) {
  const empty = { products: [], total: 0, page: q.page, pages: 0 };
  if (!hasUsableDatabaseUrl()) return empty;

  const cacheKey = `catalog:${JSON.stringify(q)}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const where = ['p.is_active = true'];
  const params = [];
  const add = (v) => { params.push(v); return `$${params.length}`; };
  const anyOf = (values, build) => `(${values.map((v) => build(add(`%${v}%`))).join(' OR ')})`;

  if (q.category) where.push(`p.category = ${add(q.category)}`);
  if (q.tier) {
    const houses = add(NICHE_HOUSES.map((h) => h.toLowerCase()));
    where.push(`p.category NOT IN ('Attar', 'Gift Sets')`);
    where.push(q.tier === 'niche' ? `LOWER(COALESCE(p.brand, '')) = ANY(${houses})` : `NOT (LOWER(COALESCE(p.brand, '')) = ANY(${houses}))`);
  }
  if (q.search) {
    const s = add(`%${q.search}%`);
    where.push(`(p.name ILIKE ${s} OR p.brand ILIKE ${s} OR p.description ILIKE ${s} OR p.top_notes ILIKE ${s} OR p.heart_notes ILIKE ${s} OR p.base_notes ILIKE ${s})`);
  }
  if (q.priceMin) where.push(`p.price >= ${add(Number(q.priceMin))}`);
  if (q.priceMax) where.push(`p.price <= ${add(Number(q.priceMax))}`);
  if (q.featured) where.push(`p.is_featured = ${add(q.featured === 'true')}`);
  if (q.inStock) where.push('p.stock > 0');
  if (q.brands.length) where.push(anyOf(q.brands, (v) => `p.brand ILIKE ${v} OR p.name ILIKE ${v}`));
  if (q.notes.length) where.push(anyOf(q.notes, (v) => `p.top_notes ILIKE ${v} OR p.heart_notes ILIKE ${v} OR p.base_notes ILIKE ${v} OR p.scent_family ILIKE ${v} OR p.description ILIKE ${v}`));
  if (q.occasions.length) where.push(anyOf(q.occasions, (v) => `p.occasion ILIKE ${v} OR p.description ILIKE ${v}`));

  const whereSql = where.join(' AND ');
  const countParams = [...params];
  const limitSql = add(q.limit);
  const offsetSql = add((q.page - 1) * q.limit);

  const [{ rows }, { rows: countRows }] = await Promise.all([
    db.query(`
      SELECT * FROM (
        SELECT p.*,
          (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) AS image,
          (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = false ORDER BY sort_order ASC LIMIT 1) AS second_image,
          (SELECT COALESCE(AVG(rating), 0)::NUMERIC(3,1) FROM reviews WHERE product_id = p.id AND is_approved = true) AS avg_rating,
          (SELECT COUNT(id) FROM reviews WHERE product_id = p.id AND is_approved = true) AS review_count,
          (SELECT COALESCE(SUM(quantity), 0) FROM order_items WHERE product_id = p.id) AS units_sold
        FROM products p
        WHERE ${whereSql}
      ) p
      ORDER BY ${SORTS[q.sort] || SORTS.newest}
      LIMIT ${limitSql} OFFSET ${offsetSql}
    `, params),
    db.query(`SELECT COUNT(*) FROM products p WHERE ${whereSql}`, countParams),
  ]);

  const total = parseInt(countRows[0].count, 10);
  const result = { products: rows, total, page: q.page, pages: Math.ceil(total / q.limit) };
  await cache.set(cacheKey, result, 300);
  return result;
}

export async function listBrands() {
  if (!hasUsableDatabaseUrl()) return [];
  const cached = await cache.get('catalog:brands');
  if (cached) return cached;
  const { rows } = await db.query(`
    SELECT brand, COUNT(*)::int AS n FROM products
    WHERE is_active = true AND brand IS NOT NULL AND brand <> ''
    GROUP BY brand ORDER BY brand ASC
  `);
  await cache.set('catalog:brands', rows, 3600);
  return rows;
}
