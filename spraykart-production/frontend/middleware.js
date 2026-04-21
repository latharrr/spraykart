import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // Protect admin pages - redirect to login if no token
  if (pathname.startsWith('/admin') && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protect admin API - return 401 immediately if no token (fast path)
  if (pathname.startsWith('/api/admin') && !token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
