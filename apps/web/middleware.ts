import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  ACCESS_TOKEN_COOKIE,
  HOME_ROUTE,
  INACTIVITY_TIMEOUT_SECONDS,
  isGuestOnlyRoute,
  isProtectedRoute,
  isSessionInactive,
  isTokenExpired,
  REFRESH_TOKEN_COOKIE,
  SESSION_ACTIVITY_COOKIE,
} from '@/lib/auth/constants';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const lastActivity = request.cookies.get(SESSION_ACTIVITY_COOKIE)?.value;
  const hasRefreshSession = Boolean(refreshToken) && !isTokenExpired(refreshToken);
  const hasActiveSession =
    (Boolean(accessToken) && !isTokenExpired(accessToken)) || hasRefreshSession;
  const sessionExpiredFromInactivity = hasActiveSession && isSessionInactive(lastActivity);

  if (sessionExpiredFromInactivity) {
    const response = NextResponse.redirect(new URL('/login?reason=inactive', request.url));

    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    response.cookies.delete(SESSION_ACTIVITY_COOKIE);

    return response;
  }

  if (isProtectedRoute(pathname) && !hasActiveSession) {
    const response = NextResponse.redirect(new URL('/login', request.url));

    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    response.cookies.delete(SESSION_ACTIVITY_COOKIE);

    return response;
  }

  if (isGuestOnlyRoute(pathname) && hasActiveSession) {
    return NextResponse.redirect(new URL(HOME_ROUTE, request.url));
  }

  const response = NextResponse.next();

  if (hasActiveSession && (isProtectedRoute(pathname) || isGuestOnlyRoute(pathname))) {
    response.cookies.set({
      name: SESSION_ACTIVITY_COOKIE,
      value: String(Date.now()),
      httpOnly: false,
      maxAge: INACTIVITY_TIMEOUT_SECONDS,
      path: '/',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/transactions',
    '/transactions/:path*',
    '/budgets',
    '/budgets/:path*',
    '/categories',
    '/categories/:path*',
    '/insights',
    '/insights/:path*',
    '/forecasts',
    '/forecasts/:path*',
    '/reports',
    '/reports/:path*',
    '/recurring',
    '/recurring/:path*',
    '/goals',
    '/goals/:path*',
    '/anomalies',
    '/anomalies/:path*',
    '/notifications',
    '/notifications/:path*',
    '/profile',
    '/profile/:path*',
    '/settings',
    '/settings/:path*',
    '/help',
    '/help/:path*',
    '/login',
    '/register',
    '/verify-email',
  ],
};
