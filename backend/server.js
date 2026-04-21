require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { rateLimiter } = require('./src/middleware/rateLimiter');
const logger = require('./src/utils/logger');

const app = express();

// Trust Next.js/Vercel proxy — required for secure cookies and IP detection
app.set('trust proxy', 1);

// ─── Allowed Origins ──────────────────────────────────────────────────────────
// Supports local dev + any number of production domains via FRONTEND_URL.
// FRONTEND_URL can be a comma-separated list: "https://spraykart.vercel.app,https://spraykart.in"
const rawOrigins = process.env.FRONTEND_URL || 'http://localhost:3000';
const allowedOrigins = new Set([
  'http://localhost:3000',
  ...rawOrigins.split(',').map((o) => o.trim()).filter(Boolean),
]);

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        'checkout.razorpay.com',
        'cdn.razorpay.com',
        "'unsafe-inline'", // Required for Razorpay inline scripts
      ],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'res.cloudinary.com', 'data:', 'blob:'],
      connectSrc: [
        "'self'",
        'api.razorpay.com',
        'lumberjack.razorpay.com',
        ...Array.from(allowedOrigins),
      ],
      frameSrc: ["'self'", 'api.razorpay.com'],
      fontSrc: ["'self'", 'fonts.googleapis.com', 'fonts.gstatic.com'],
    },
  },
  // Allow Razorpay to load in iframes
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server requests (no origin) and requests from allowed origins
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked: ${origin}`);
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    }
  },
  credentials: true, // Required for httpOnly cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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

// Local dev server — Vercel uses module.exports, never calls listen()
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => logger.info(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`));
}

module.exports = app;
