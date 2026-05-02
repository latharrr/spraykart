/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── Images ─────────────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 365,  // 1 year for hashed images
    deviceSizes: [390, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
  },

  // ─── Core ────────────────────────────────────────────────────────────────────
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  optimizeFonts: true,

  // ─── Performance ────────────────────────────────────────────────────────────
  // serverExternalPackages replaces experimental.serverComponentsExternalPackages (Next.js 14+)
  serverExternalPackages: ['pg', 'bcryptjs', 'jsonwebtoken'],

  experimental: {
    optimizePackageImports: ['lucide-react', '@headlessui/react', 'react-hot-toast'],
  },

  webpack: (config, { isServer }) => {
    config.externals.push({ 'pg-cloudflare': 'pg-cloudflare' });

    // Tree-shake unused code
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };
    }

    return config;
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
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif|woff2|woff|ttf|otf)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // API routes must NOT have a shared public cache — individual handlers set
      // their own Cache-Control when they want caching (e.g. /api/products).
      // A blanket `public, max-age=60` here would cause CDNs to cache
      // user-specific responses (orders, auth state) and serve them cross-user.
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      // HTML pages — ISR with stale-while-revalidate
      {
        source: '/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://static.paytm.com https://securegw-stage.paytm.in https://securegw.paytm.in; frame-src 'self' https://checkout.razorpay.com https://static.paytm.com https://securegw-stage.paytm.in https://securegw.paytm.in; img-src 'self' data: https: blob:; font-src 'self' data: https:; connect-src 'self' https:; style-src 'self' 'unsafe-inline' https:; media-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self' https://checkout.razorpay.com https://securegw-stage.paytm.in https://securegw.paytm.in" },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
