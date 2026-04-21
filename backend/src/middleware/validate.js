/**
 * Zod validation middleware factory.
 * Usage: router.post('/route', validate(mySchema), handler)
 */
exports.validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: result.error.flatten().fieldErrors,
    });
  }
  req.body = result.data; // Use sanitized/coerced data
  next();
};
