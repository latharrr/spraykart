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

// Build a redirect URL that honors X-Forwarded-Host / X-Forwarded-Proto.
// Without this, request.url inside middleware can resolve to http://127.0.0.1:3000
// (the upstream the proxy talks to), causing admin → login redirects to land on localhost.
function buildRedirect(request, pathname) {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const publicSite = process.env.NEXT_PUBLIC_SITE_URL;

  let base;
  if (forwardedHost) {
    const proto = forwardedProto || 'https';
    base = `${proto}://${forwardedHost}`;
  } else if (publicSite) {
    base = publicSite;
  } else {
    // Fallback: clone nextUrl which is request-derived
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = '';
    return NextResponse.redirect(url);
  }
  return NextResponse.redirect(new URL(pathname, base));
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;
  const method = request.method.toUpperCase();

  // Protect admin pages - redirect to login if no token
  if (pathname.startsWith('/admin') && !token) {
    return ensureCsrfCookie(request, buildRedirect(request, '/login'));
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
