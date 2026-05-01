export const CSRF_COOKIE_NAME = 'csrf_token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

const EXEMPT_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/payments/webhook',
  '/api/payments/paytm/webhook',
  '/api/payments/paytm/callback',
]);

export function isStateChangingMethod(method = 'GET') {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
}

export function isCsrfExemptPath(pathname = '') {
  return EXEMPT_PATHS.has(pathname);
}

export function getCsrfCookieOptions(maxAge = 7 * 24 * 60 * 60) {
  return {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge,
  };
}

export function generateCsrfToken() {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function getCookieFromDocument(name) {
  if (typeof document === 'undefined') return '';
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : '';
}

export function withCsrfHeader(headers = {}) {
  const token = getCookieFromDocument(CSRF_COOKIE_NAME);
  return token ? { ...headers, [CSRF_HEADER_NAME]: token } : headers;
}

export function fetchWithCsrf(input, init = {}) {
  const method = (init.method || 'GET').toUpperCase();
  if (!isStateChangingMethod(method)) {
    return fetch(input, init);
  }

  return fetch(input, {
    ...init,
    headers: withCsrfHeader(init.headers || {}),
  });
}
