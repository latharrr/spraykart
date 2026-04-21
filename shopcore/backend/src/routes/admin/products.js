const router = require('express').Router();
const db = require('../../config/db');
const { protect, adminOnly } = require('../../middleware/auth');
const { upload, cloudinary } = require('../../config/cloudinary');
const { validate } = require('../../middleware/validate');
const { createProductSchema, updateProductSchema } = require('../../schemas/product.schema');
const cache = require('../../services/cache.service');
const slugify = require('slugify');
const logger = require('../../utils/logger');

router.use(protect, adminOnly);

// GET /api/admin/products
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*, 
        (SELECT url FROM product_images WHERE product_id=p.id AND is_primary=true LIMIT 1) as image,
        (SELECT COUNT(*) FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE oi.product_id=p.id AND o.status!='cancelled') as units_sold
       FROM products p ORDER BY p.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/products
router.post('/', upload.array('images', 8), validate(createProductSchema), async (req, res) => {
  const { name, description, price, compare_price, stock, category, is_featured, meta_title, meta_description } = req.body;
  const slug = slugify(name, { lower: true, strict: true });
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO products(name,slug,description,price,compare_price,stock,category,is_featured,meta_title,meta_description)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [name, slug, description || null, price, compare_price || null, stock || 0, category || null, is_featured || false, meta_title || null, meta_description || null]
    );
    const product = rows[0];

    // Save uploaded images
    if (req.files?.length) {
      for (let i = 0; i < req.files.length; i++) {
        await client.query(
          `INSERT INTO product_images(product_id, url, public_id, is_primary, sort_order)
           VALUES($1,$2,$3,$4,$5)`,
          [product.id, req.files[i].path, req.files[i].filename, i === 0, i]
        );
      }
    }

    // Save variants
    const variants = (() => {
      try { return JSON.parse(req.body.variants || '[]'); } catch { return []; }
    })();
    for (const v of variants) {
      await client.query(
        'INSERT INTO variants(product_id,type,value,stock) VALUES($1,$2,$3,$4)',
        [product.id, v.type, v.value, v.stock || 0]
      );
    }

    await client.query('COMMIT');

    // Invalidate product listing cache
    await cache.delPattern('products:*');
    logger.info(`Admin created product: ${product.name} (${product.id})`);
    res.status(201).json(product);
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error(`Product creation failed: ${err.message}`);
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT /api/admin/products/:id
router.put('/:id', upload.array('images', 8), async (req, res) => {
  const { name, description, price, compare_price, stock, category, is_featured, is_active } = req.body;
  const slug = name ? slugify(name, { lower: true, strict: true }) : undefined;

  try {
    const { rows } = await db.query(
      `UPDATE products SET
        name=COALESCE($1,name), slug=COALESCE($2,slug),
        description=COALESCE($3,description), price=COALESCE($4,price),
        compare_price=$5, stock=COALESCE($6,stock),
        category=COALESCE($7,category),
        is_featured=COALESCE($8,is_featured),
        is_active=COALESCE($9,is_active)
       WHERE id=$10 RETURNING *`,
      [
        name, slug, description, price ? parseFloat(price) : undefined,
        compare_price ? parseFloat(compare_price) : null,
        stock ? parseInt(stock) : undefined, category,
        is_featured !== undefined ? is_featured === 'true' : undefined,
        is_active !== undefined ? is_active === 'true' : undefined,
        req.params.id,
      ]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });

    if (req.files?.length) {
      for (let i = 0; i < req.files.length; i++) {
        await db.query(
          'INSERT INTO product_images(product_id,url,public_id,sort_order) VALUES($1,$2,$3,$4)',
          [req.params.id, req.files[i].path, req.files[i].filename, i]
        );
      }
    }

    // Invalidate caches
    await Promise.all([
      cache.delPattern('products:*'),
      cache.del(`product:${rows[0].slug}`),
    ]);

    logger.info(`Admin updated product: ${rows[0].name} (${req.params.id})`);
    res.json(rows[0]);
  } catch (err) {
    logger.error(`Product update failed: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/products/:id
router.delete('/:id', async (req, res) => {
  try {
    // Get product slug before deletion (for cache invalidation)
    const { rows: product } = await db.query('SELECT slug FROM products WHERE id=$1', [req.params.id]);
    if (!product.length) return res.status(404).json({ error: 'Product not found' });

    // Delete Cloudinary images first
    const { rows: images } = await db.query(
      'SELECT public_id FROM product_images WHERE product_id=$1',
      [req.params.id]
    );
    await Promise.allSettled(
      images.filter(img => img.public_id).map(img => cloudinary.uploader.destroy(img.public_id))
    );

    await db.query('DELETE FROM products WHERE id=$1', [req.params.id]);

    await Promise.all([
      cache.delPattern('products:*'),
      cache.del(`product:${product[0].slug}`),
    ]);

    logger.info(`Admin deleted product ${req.params.id}`);
    res.json({ success: true });
  } catch (err) {
    logger.error(`Product deletion failed: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/products/:id/images/:imageId
router.delete('/:id/images/:imageId', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM product_images WHERE id=$1 AND product_id=$2',
      [req.params.imageId, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Image not found' });

    if (rows[0].public_id) {
      await cloudinary.uploader.destroy(rows[0].public_id);
    }
    await db.query('DELETE FROM product_images WHERE id=$1', [req.params.imageId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
