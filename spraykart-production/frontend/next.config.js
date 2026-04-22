/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── Compression & headers ────────────────────────────────────────────────
  compress: true,          // gzip responses (20-40% payload reduction)
  poweredByHeader: false,  // don't leak Next.js version

  // ─── Image optimization ──────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    formats: ['image/avif', 'image/webp'],         // serve modern formats
    minimumCacheTTL: 60 * 60 * 24 * 30,            // cache images for 30 days
  },

  reactStrictMode: true,

  // ─── Bundle optimizations ────────────────────────────────────────────────
  experimental: {
    optimizePackageImports: ['lucide-react', '@headlessui/react'],
  },

  // ─── HTTP headers ────────────────────────────────────────────────────────
  async headers() {
    return [
      // Long-lived immutable cache for all Next.js static assets
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // stale-while-revalidate for public pages
      {
        source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' },
        ],
      },
      // Security headers for all routes
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'X-Frame-Options',          value: 'DENY' },
          { key: 'X-XSS-Protection',         value: '1; mode=block' },
          { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },

  // External packages that need to run server-side only
  serverExternalPackages: ['pg', 'bcryptjs', 'jsonwebtoken'],
};

module.exports = nextConfig;
