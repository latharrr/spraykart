/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── Images ─────────────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    formats: ['image/avif', 'image/webp'],   // modern formats = 30-50% smaller
    minimumCacheTTL: 60 * 60 * 24 * 30,     // 30-day browser cache for images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // ─── Core ────────────────────────────────────────────────────────────────────
  reactStrictMode: true,
  compress: true,               // gzip/brotli all responses
  poweredByHeader: false,       // remove X-Powered-By leakage

  // ─── Bundle optimisation ─────────────────────────────────────────────────────
  serverExternalPackages: ['pg', 'bcryptjs', 'jsonwebtoken'],
  experimental: {
    // Tree-shake these large packages — only bundle the icons/components used
    optimizePackageImports: ['lucide-react', '@headlessui/react'],
  },

  // ─── HTTP caching headers ────────────────────────────────────────────────────
  async headers() {
    return [
      // Immutable static assets (hashed filenames by Next.js)
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Media & fonts served from the app
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|woff2|woff)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // HTML pages — revalidate often but serve stale while revalidating
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com; connect-src 'self' https://api.razorpay.com https://lumberjack-cx.razorpay.com;" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
