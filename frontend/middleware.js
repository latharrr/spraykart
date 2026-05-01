import { NextResponse } from 'next/server';
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  generateCsrfToken,
  getCsrfCookieOptions,
  isCsrfExemptPath,
  isStateChangingMethod,
} from './lib/csrf';

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

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
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
