const { z } = require('zod');

exports.createProductSchema = z.object({
  name: z.string().min(2).max(255).trim(),
  description: z.string().max(5000).trim().optional(),
  price: z.coerce.number().positive('Price must be positive'),
  compare_price: z.coerce.number().positive().optional().nullable(),
  stock: z.coerce.number().int().min(0).default(0),
  category: z.string().max(100).trim().optional(),
  is_featured: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  meta_title: z.string().max(255).trim().optional(),
  meta_description: z.string().max(500).trim().optional(),
  variants: z.string().optional(), // JSON string, parsed in route
});

exports.updateProductSchema = exports.createProductSchema.partial();

exports.createCouponSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase().trim(),
  type: z.enum(['percentage', 'flat']),
  value: z.coerce.number().positive(),
  min_order: z.coerce.number().min(0).default(0),
  max_uses: z.coerce.number().int().min(1).default(100),
  expiry_date: z.string().datetime().optional().nullable(),
  is_active: z.boolean().default(true),
  // Empty array = applies to entire cart. Non-empty = only those product IDs.
  applicable_products: z.array(z.string().uuid()).default([]),
});
