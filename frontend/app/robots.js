export default function robots() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://spraykart.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/checkout', '/cart', '/account'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
