import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['auth/register', '/dashboard', '/tickets'];
const authRoutes = ['/auth/login', '/auth/register']; 

export function proxy(request: NextRequest) {
  const token = request.cookies.get("session_access_token")?.value;
  const { pathname, search } = request.nextUrl;

  // 1. Force the root to login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // 2. Redirect to login if trying to access protected route without token
  if (!token && protectedRoutes.some(route => pathname.startsWith(route))) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Prevent logged-in users from hitting login
  if (token && ['/auth/login'].some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard',
    '/tickets/:path*',
    '/auth/:path*', 
  ],
};