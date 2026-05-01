import { NextResponse } from 'next/server';
import db from '@/lib/db';
import cache from '@/lib/cache';
import logger from '@/lib/logger';

const ALLOWED_SORTS = ['price', 'created_at', 'name'];

function buildCacheKey(params) {
  const sorted = Object.keys(params).sort().reduce((acc, k) => { acc[k] = params[k]; return acc; }, {});
  return `products:${JSON.stringify(sorted)}`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'created_at';
  const order = searchParams.get('order') || 'DESC';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 100);
  const min_price = searchParams.get('min_price');
  const max_price = searchParams.get('max_price');
  const is_featured = searchParams.get('is_featured');

  const queryParams = { category, search, sort, order, page, limit, min_price, max_price, is_featured };
  const cacheKey = buildCacheKey(queryParams);

  const cached = await cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  const offset = (page - 1) * limit;
  const conditions = ['p.is_active = true'];
  const params = [];
  let i = 1;

  if (category)    { conditions.push(`p.category = $${i++}`);    params.push(category); }
  if (search)      { conditions.push(`(p.name ILIKE $${i++} OR p.description ILIKE $${i-1})`);    params.push(`%${search}%`); }
  if (min_price)   { conditions.push(`p.price >= $${i++}`);      params.push(min_price); }
  if (max_price)   { conditions.push(`p.price <= $${i++}`);      params.push(max_price); }
  if (is_featured) { conditions.push(`p.is_featured = $${i++}`); params.push(is_featured === 'true'); }

  const sortField = ALLOWED_SORTS.includes(sort) ? sort : 'created_at';
  const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';
  const where = conditions.join(' AND ');
  const countParams = [...params];
  params.push(limit, offset);

  try {
    const [{ rows }, { rows: countRows }] = await Promise.all([
      db.query(`
        WITH paged_products AS (
          SELECT p.*
          FROM products p
          WHERE ${where}
          ORDER BY p.${sortField} ${sortOrder}
          LIMIT $${i++} OFFSET $${i++}
        )
        SELECT paged_products.*,
          (
            SELECT url FROM product_images 
            WHERE product_id = paged_products.id AND is_primary = true 
            LIMIT 1
          ) AS image,
          (
            SELECT COALESCE(AVG(rating), 0)::NUMERIC(3,1) FROM reviews 
            WHERE product_id = paged_products.id AND is_approved = true
          ) AS avg_rating,
          (
            SELECT COUNT(id) FROM reviews 
            WHERE product_id = paged_products.id AND is_approved = true
          ) AS review_count
        FROM paged_products
        ORDER BY paged_products.${sortField} ${sortOrder}
      `, params),
      db.query(`SELECT COUNT(*) FROM products p WHERE ${where}`, countParams),
    ]);

    const result = {
      products: rows,
      total: parseInt(countRows[0].count),
      page,
      pages: Math.ceil(parseInt(countRows[0].count) / limit),
    };

    await cache.set(cacheKey, result, 300);
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900',
      },
    });
  } catch (err) {
    logger.error('Products list error:', err);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
