/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['pg', 'bcryptjs', 'jsonwebtoken'],
  },
};
module.exports = nextConfig;
