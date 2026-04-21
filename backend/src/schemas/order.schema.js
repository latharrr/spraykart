const { z } = require('zod');

const orderItemSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  variant_id: z.string().uuid().nullable().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(100),
});

const shippingAddressSchema = z.object({
  line1: z.string().min(5, 'Address is too short').max(255).trim(),
  line2: z.string().max(255).trim().optional(),
  city: z.string().min(2).max(100).trim(),
  state: z.string().min(2).max(100).trim(),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
});

exports.createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required').max(50),
  shipping_address: shippingAddressSchema,
  coupon_code: z.string().max(50).trim().optional(),
  razorpay_order_id: z.string().optional(),
});

exports.verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});
