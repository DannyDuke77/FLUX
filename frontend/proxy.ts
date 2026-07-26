import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/tickets', '/auth/register', '/settings', '/admin'];
const authRoutes = ['/auth/login']; 

export function proxy(request: NextRequest) {
  const token = request.cookies.get("session_access_token")?.value;
  const { pathname, search } = request.nextUrl;

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  if (!token && isProtectedRoute) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL('/tickets', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};