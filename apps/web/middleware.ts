import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE = 'spendwise_access_token';

export function middleware(request: NextRequest) {
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/profile');

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/profile/:path*']
};
