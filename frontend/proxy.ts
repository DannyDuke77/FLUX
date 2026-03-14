import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/tickets', 'auth/register'];
const authRoutes = ['/auth/login']; 

// The export MUST be named "proxy" for this file convention
export function proxy(request: NextRequest) {
  const token = request.cookies.get("session_access_token")?.value;
  const { pathname, search } = request.nextUrl;

  // 1. Force the root to login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // 2. Redirect to login if trying to access protected route without token
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  if (!token && isProtectedRoute) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Prevent logged-in users from hitting login page
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL('/tickets', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};