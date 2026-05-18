export function hasUsableDatabaseUrl() {
  const value = process.env.DATABASE_URL || '';
  return Boolean(
    value &&
      !value.includes('[PROJECT]') &&
      !value.includes('[PASSWORD]') &&
      !value.includes('your_') &&
      !value.includes('example')
  );
}

// Canonical production site URL. All link generation (emails, sitemap, robots,
// canonical tags, metadataBase) should resolve through this so a single misconfigured
// env var can never spawn a "localhost" or "vercel.app" link in production.
const FALLBACK_SITE_URL = 'https://spraykart.in';

export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) return FALLBACK_SITE_URL;
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return FALLBACK_SITE_URL;
  // Never let localhost / 127.0.0.1 leak into production-facing URLs.
  if (process.env.NODE_ENV === 'production' && /localhost|127\.0\.0\.1/i.test(trimmed)) {
    return FALLBACK_SITE_URL;
  }
  return trimmed;
}

export const SITE_URL = getSiteUrl();
