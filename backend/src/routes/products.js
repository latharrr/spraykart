const router = require('express').Router();
const db = require('../config/db');
const cache = require('../services/cache.service');

// Normalize query params to a stable cache key (fixes ordering issues)
const buildCacheKey = (query) => {
  const sorted = Object.keys(query).sort().reduce((acc, k) => {
    acc[k] = query[k];
    return acc;
  }, {});
  return `products:${JSON.stringify(sorted)}`;
};

// GET /api/products — list with filters, sort, pagination
router.get('/', async (req, res) => {
  const {
    category, search, sort = 'created_at', order = 'DESC',
    page = 1, limit = 12, min_price, max_price, is_featured,
  } = req.query;

  // Try cache first
  const cacheKey = buildCacheKey(req.query);
  const cached = await cache.get(cacheKey);
  if (cached) return res.json(cached);

  const offset = (page - 1) * limit;
  const conditions = ['p.is_active = true'];
  const params = [];
  let i = 1;

  if (category)    { conditions.push(`p.category = $${i++}`);        params.push(category); }
  if (search)      { conditions.push(`p.name ILIKE $${i++}`);        params.push(`%${search}%`); }
  if (min_price)   { conditions.push(`p.price >= $${i++}`);          params.push(min_price); }
  if (max_price)   { conditions.push(`p.price <= $${i++}`);          params.push(max_price); }
  if (is_featured) { conditions.push(`p.is_featured = $${i++}`);     params.push(is_featured === 'true'); }

  const allowedSorts = ['price', 'created_at', 'name'];
  const sortField = allowedSorts.includes(sort) ? sort : 'created_at';
  const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

  const where = conditions.join(' AND ');
  const countParams = [...params];
  params.push(parseInt(limit), parseInt(offset));

  try {
    const { rows } = await db.query(`
      SELECT p.*,
        (SELECT url FROM product_images WHERE product_id=p.id AND is_primary=true LIMIT 1) as image,
        COALESCE(AVG(r.rating), 0)::NUMERIC(3,1) as avg_rating,
        COUNT(DISTINCT r.id) as review_count
      FROM products p
      LEFT JOIN reviews r ON r.product_id = p.id AND r.is_approved = true
      WHERE ${where}
      GROUP BY p.id
      ORDER BY p.${sortField} ${sortOrder}
      LIMIT $${i++} OFFSET $${i++}
    `, params);

    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) FROM products p WHERE ${where}`,
      countParams
    );

    const result = {
      products: rows,
      total: parseInt(countRows[0].count),
      page: parseInt(page),
      pages: Math.ceil(countRows[0].count / parseInt(limit)),
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, result, 300);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:slug
router.get('/:slug', async (req, res) => {
  const cacheKey = `product:${req.params.slug}`;
  const cached = await cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const { rows } = await db.query(`
      SELECT p.*,
        COALESCE(AVG(r.rating), 0)::NUMERIC(3,1) as avg_rating,
        COUNT(DISTINCT r.id) as review_count
      FROM products p
      LEFT JOIN reviews r ON r.product_id = p.id AND r.is_approved = true
      WHERE p.slug = $1 AND p.is_active = true
      GROUP BY p.id
    `, [req.params.slug]);

    if (!rows.length) return res.status(404).json({ error: 'Product not found' });

    const product = rows[0];

    const [images, variants, reviews] = await Promise.all([
      db.query('SELECT * FROM product_images WHERE product_id=$1 ORDER BY sort_order', [product.id]),
      db.query('SELECT * FROM variants WHERE product_id=$1', [product.id]),
      db.query(`
        SELECT r.*, u.name as user_name
        FROM reviews r JOIN users u ON u.id=r.user_id
        WHERE r.product_id=$1 AND r.is_approved=true
        ORDER BY r.created_at DESC LIMIT 10
      `, [product.id]),
    ]);

    const result = {
      ...product,
      images: images.rows,
      variants: variants.rows,
      reviews: reviews.rows,
    };

    await cache.set(cacheKey, result, 300);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
