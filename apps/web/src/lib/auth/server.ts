import 'server-only';

import type { AuthSession, AuthTokens, UserProfile } from '@spendwise/shared';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  ACCESS_TOKEN_COOKIE,
  getTokenExpiryTimestamp,
  INACTIVITY_TIMEOUT_SECONDS,
  isTokenExpired,
  REFRESH_TOKEN_COOKIE,
  SESSION_ACTIVITY_COOKIE,
} from './constants';

const backendBaseUrl =
  process.env.API_BASE_URL ?? process.env.MOBILE_API_URL ?? 'http://localhost:4000/api/v1';

class ApiRouteError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

interface SafeParseSchema<TOutput> {
  safeParse: (
    input: unknown,
  ) => { success: true; data: TOutput } | { success: false; error: { flatten: () => unknown } };
}

const parseJsonSafely = async (response: Response) => {
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    return undefined;
  }

  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return undefined;
  }
};

const cookieSecurity = process.env.NODE_ENV === 'production';

const setCookie = (response: NextResponse, name: string, value: string, maxAge: number) => {
  response.cookies.set({
    name,
    value,
    httpOnly: true,
    maxAge,
    path: '/',
    sameSite: 'strict',
    secure: cookieSecurity,
  });
};

const clearCookie = (response: NextResponse, name: string, httpOnly = true) => {
  response.cookies.set({
    name,
    value: '',
    httpOnly,
    maxAge: 0,
    path: '/',
    sameSite: 'strict',
    secure: cookieSecurity,
  });
};

const getRefreshTokenMaxAge = (refreshToken: string) => {
  const expiry = getTokenExpiryTimestamp(refreshToken);

  if (!expiry) {
    return 60 * 60 * 24 * 7;
  }

  return Math.max(1, Math.floor((expiry - Date.now()) / 1000));
};

export const touchActivityCookie = (response: NextResponse, timestamp = Date.now()) => {
  response.cookies.set({
    name: SESSION_ACTIVITY_COOKIE,
    value: String(timestamp),
    httpOnly: false,
    maxAge: INACTIVITY_TIMEOUT_SECONDS,
    path: '/',
    sameSite: 'strict',
    secure: cookieSecurity,
  });
};

export const setSessionCookies = (response: NextResponse, tokens: AuthTokens) => {
  setCookie(response, ACCESS_TOKEN_COOKIE, tokens.accessToken, Math.max(1, tokens.expiresIn));
  setCookie(
    response,
    REFRESH_TOKEN_COOKIE,
    tokens.refreshToken,
    getRefreshTokenMaxAge(tokens.refreshToken),
  );
  touchActivityCookie(response);
};

export const clearSessionCookies = (response: NextResponse) => {
  clearCookie(response, ACCESS_TOKEN_COOKIE);
  clearCookie(response, REFRESH_TOKEN_COOKIE);
  clearCookie(response, SESSION_ACTIVITY_COOKIE, false);
};

export const createAuthenticationRequiredResponse = () => {
  const response = NextResponse.json(
    {
      message: 'Authentication required.',
    },
    {
      status: 401,
    },
  );

  clearSessionCookies(response);

  return response;
};

export const resolveAccessToken = (request: NextRequest, session: { tokens?: AuthTokens } | null) =>
  session?.tokens?.accessToken ?? request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

export const applySessionToResponse = (
  response: NextResponse,
  session: { tokens?: AuthTokens },
) => {
  if (session.tokens) {
    setSessionCookies(response, session.tokens);
  } else {
    touchActivityCookie(response);
  }

  return response;
};

export const parseRequestBody = async <TOutput>(
  request: Request,
  schema: SafeParseSchema<TOutput>,
) => {
  const payload = await request.json().catch(() => {
    throw new ApiRouteError('Request body must be valid JSON.', 400);
  });

  const result = schema.safeParse(payload);

  if (!result.success) {
    throw new ApiRouteError('Validation failed.', 400, result.error.flatten());
  }
  return result.data;
};

export const fetchBackend = async <T>(path: string, init: RequestInit = {}) => {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  let response: Response;

  try {
    response = await fetch(`${backendBaseUrl}${path}`, {
      ...init,
      cache: 'no-store',
      headers,
    });
  } catch {
    throw new ApiRouteError(
      'The authentication service is unavailable right now. Start the API server on port 4000 and try again.',
      503,
    );
  }

  const body = await parseJsonSafely(response);

  if (!response.ok) {
    const message =
      typeof body?.message === 'string' ? body.message : 'The request could not be completed.';

    throw new ApiRouteError(message, response.status, body);
  }

  if (body && 'data' in body) {
    return body.data as T;
  }

  return body as T;
};

const fetchProfile = (accessToken: string) =>
  fetchBackend<UserProfile>('/users/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

export const refreshSession = (refreshToken: string) =>
  fetchBackend<AuthSession>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });

export const getCurrentUserFromRequest = async (
  request: NextRequest,
): Promise<{ user: UserProfile; tokens?: AuthTokens } | null> => {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!accessToken && !refreshToken) {
    return null;
  }

  if (accessToken && !isTokenExpired(accessToken)) {
    try {
      const user = await fetchProfile(accessToken);
      return { user };
    } catch (error) {
      if (!(error instanceof ApiRouteError) || error.status !== 401) {
        throw error;
      }
    }
  }

  if (!refreshToken || isTokenExpired(refreshToken)) {
    return null;
  }

  const session = await refreshSession(refreshToken);
  const user = await fetchProfile(session.tokens.accessToken);

  return {
    user,
    tokens: session.tokens,
  };
};

export const revokeServerSession = async (input: {
  accessToken?: string;
  refreshToken?: string;
}) => {
  let accessToken = input.accessToken;

  if (
    (!accessToken || isTokenExpired(accessToken)) &&
    input.refreshToken &&
    !isTokenExpired(input.refreshToken)
  ) {
    try {
      const session = await refreshSession(input.refreshToken);
      accessToken = session.tokens.accessToken;
    } catch {
      accessToken = undefined;
    }
  }

  if (!accessToken || isTokenExpired(accessToken)) {
    return;
  }

  try {
    await fetchBackend('/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch {
    // Clearing cookies on the web tier still ends the browser session even if API revocation fails.
  }
};

export const createErrorResponse = (error: unknown, options: { exposeMessage?: boolean } = {}) => {
  if (error instanceof ApiRouteError) {
    return NextResponse.json(
      {
        message: options.exposeMessage ? error.message : getGenericErrorMessage(error.status),
      },
      {
        status: error.status,
      },
    );
  }
  return NextResponse.json(
    {
      message: getGenericErrorMessage(500),
    },
    {
      status: 500,
    },
  );
};

const getGenericErrorMessage = (status: number) => {
  if (status === 429) {
    return 'Please wait a moment and try again.';
  }

  if (status >= 500) {
    return 'Something went wrong. Please try again shortly.';
  }

  return 'The request could not be completed.';
};
