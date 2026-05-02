import { NextResponse } from 'next/server';
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  generateCsrfToken,
  getCsrfCookieOptions,
  isCsrfExemptPath,
  isStateChangingMethod,
} from './lib/csrf';

// Constant-time string comparison for Edge runtime (no crypto.timingSafeEqual available)
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const lenA = a.length;
  const lenB = b.length;
  let result = lenA ^ lenB;
  const maxLen = Math.max(lenA, lenB) || 1;
  for (let i = 0; i < maxLen; i++) {
    result |= (a.charCodeAt(i % lenA) || 0) ^ (b.charCodeAt(i % lenB) || 0);
  }
  return result === 0;
}

function ensureCsrfCookie(request, response) {
  if (!request.cookies.get(CSRF_COOKIE_NAME)?.value) {
    response.cookies.set(CSRF_COOKIE_NAME, generateCsrfToken(), getCsrfCookieOptions());
  }
  return response;
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;
  const method = request.method.toUpperCase();

  // Protect admin pages - redirect to login if no token
  if (pathname.startsWith('/admin') && !token) {
    return ensureCsrfCookie(request, NextResponse.redirect(new URL('/login', request.url)));
  }

  // Protect admin API - return 401 immediately if no token (fast path)
  if (pathname.startsWith('/api/admin') && !token) {
    return ensureCsrfCookie(
      request,
      NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    );
  }

  if (
    pathname.startsWith('/api/') &&
    isStateChangingMethod(method) &&
    !isCsrfExemptPath(pathname)
  ) {
    const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
    const headerToken = request.headers.get(CSRF_HEADER_NAME);

    if (!cookieToken || !headerToken || !timingSafeEqual(cookieToken, headerToken)) {
      return ensureCsrfCookie(
        request,
        NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
      );
    }
  }

  return ensureCsrfCookie(request, NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
