export const ACCESS_TOKEN_COOKIE = 'spendwise_access_token';
export const REFRESH_TOKEN_COOKIE = 'spendwise_refresh_token';
export const SESSION_ACTIVITY_COOKIE = 'spendwise_last_activity';
export const LOGOUT_INTENT_STORAGE_KEY = 'spendwise_logout_intent';

export const HOME_ROUTE = '/dashboard';
export const INACTIVITY_TIMEOUT_MINUTES = 30;
export const INACTIVITY_TIMEOUT_MS = INACTIVITY_TIMEOUT_MINUTES * 60 * 1000;
export const INACTIVITY_TIMEOUT_SECONDS = INACTIVITY_TIMEOUT_MS / 1000;

export const protectedRouteRoots = [
  '/dashboard',
  '/transactions',
  '/budgets',
  '/categories',
  '/insights',
  '/forecasts',
  '/reports',
  '/recurring',
  '/goals',
  '/anomalies',
  '/notifications',
  '/profile',
  '/settings',
  '/help',
] as const;

export const guestOnlyRoutes = ['/login', '/register'] as const;

const matchesRoute = (pathname: string, route: string) =>
  pathname === route || pathname.startsWith(`${route}/`);

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');

  if (typeof atob === 'function') {
    return atob(padded);
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(padded, 'base64').toString('utf-8');
  }

  return null;
};

export const isProtectedRoute = (pathname: string) =>
  protectedRouteRoots.some((route) => matchesRoute(pathname, route));

export const isGuestOnlyRoute = (pathname: string) =>
  guestOnlyRoutes.some((route) => matchesRoute(pathname, route));

export const getTokenExpiryTimestamp = (token?: string | null) => {
  if (!token) {
    return null;
  }

  const parts = token.split('.');

  if (parts.length < 2) {
    return null;
  }

  try {
    const payloadPart = parts[1];

    if (!payloadPart) {
      return null;
    }

    const decoded = decodeBase64Url(payloadPart);

    if (!decoded) {
      return null;
    }

    const payload = JSON.parse(decoded) as { exp?: number };

    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token?: string | null, now = Date.now()) => {
  const expiry = getTokenExpiryTimestamp(token);

  return typeof expiry === 'number' ? expiry <= now : true;
};

export const isSessionInactive = (lastActivity?: string | null, now = Date.now()) => {
  if (!lastActivity) {
    return false;
  }

  const parsed = Number(lastActivity);

  if (!Number.isFinite(parsed)) {
    return false;
  }

  return now - parsed >= INACTIVITY_TIMEOUT_MS;
};

export const buildActivityCookieString = (timestamp = Date.now()) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';

  return `${SESSION_ACTIVITY_COOKIE}=${timestamp}; Max-Age=${INACTIVITY_TIMEOUT_SECONDS}; Path=/; SameSite=Strict${secure}`;
};

export const getUserInitials = (name?: string) => {
  if (!name) {
    return 'SW';
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return 'SW';
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
};
