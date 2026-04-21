require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { rateLimiter } = require('./src/middleware/rateLimiter');
const logger = require('./src/utils/logger');

const app = express();

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "checkout.razorpay.com"],
      imgSrc: ["'self'", "res.cloudinary.com", "data:", "blob:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:3000'],
      frameSrc: ["'self'", "api.razorpay.com"],
    },
  },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // Required for httpOnly cookies
}));

// ─── Razorpay Webhook — MUST be before express.json() (needs raw body) ───────
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());

// ─── Logging ─────────────────────────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
  skip: (req) => req.url === '/health', // Don't log health checks
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use(rateLimiter);

// ─── Public Routes ────────────────────────────────────────────────────────────
app.use('/api/auth',        require('./src/routes/auth'));
app.use('/api/products',    require('./src/routes/products'));
app.use('/api/orders',      require('./src/routes/orders'));
app.use('/api/payments',    require('./src/routes/payments'));
app.use('/api/reviews',     require('./src/routes/reviews'));
app.use('/api/apply-coupon', require('./src/routes/coupons'));

// ─── Admin Routes ─────────────────────────────────────────────────────────────
app.use('/api/admin/products',  require('./src/routes/admin/products'));
app.use('/api/admin/orders',    require('./src/routes/admin/orders'));
app.use('/api/admin/users',     require('./src/routes/admin/users'));
app.use('/api/admin/reviews',   require('./src/routes/admin/reviews'));
app.use('/api/admin/coupons',   require('./src/routes/admin/coupons'));
app.use('/api/admin/analytics', require('./src/routes/admin/analytics'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const db = require('./src/config/db');
  let dbStatus = 'ok';
  let dbError = null;
  try {
    await db.query('SELECT 1');
  } catch (err) {
    dbStatus = 'error';
    dbError = err.message;
  }
  res.json({
    status: 'ok',
    db: dbStatus,
    error: dbError,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error({ message: err.message, stack: err.stack, url: req.url, method: req.method });
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Local dev server — Vercel ignores this and uses module.exports instead
if (process.env.NODE_ENV !== 'production' || process.env.LOCAL_DEV) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => logger.info(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`));
}

module.exports = app;
