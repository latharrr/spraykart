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
  reactStrictMode: false,  // Strict mode runs effects twice in dev, disable for faster builds
  compress: true,
  poweredByHeader: false,
  swcMinify: true,
  productionBrowserSourceMaps: false,  // Don't ship source maps to production
  optimizeFonts: true,  // Inline critical font metrics
  
  // ─── Performance ────────────────────────────────────────────────────────────
  experimental: {
    serverComponentsExternalPackages: ['pg', 'bcryptjs', 'jsonwebtoken'],
    optimizePackageImports: ['lucide-react', '@headlessui/react', 'react-hot-toast'],
    isrMemoryCacheSize: 52 * 1024 * 1024,  // Increase ISR cache to 52MB
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
      // API responses — shorter cache
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' },
        ],
      },
      // HTML pages — ISR with stale-while-revalidate
      {
        source: '/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
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
