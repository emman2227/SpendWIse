import { clearStoredTokens, getStoredTokens, saveTokens } from '../auth/secure-storage';
import { getApiBaseUrl } from '../config/api-url';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

type AuthFailureListener = () => void;
let authFailureListener: AuthFailureListener | null = null;

export const setOnAuthFailure = (listener: AuthFailureListener | null) => {
  authFailureListener = listener;
};

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  const { refreshToken } = await getStoredTokens();
  if (!refreshToken) {
    return null;
  }

  const baseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      await clearStoredTokens();
      authFailureListener?.();
      return null;
    }

    const payload = await res.json();
    const data =
      payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
    const tokens = data?.tokens;

    if (tokens?.accessToken && tokens?.refreshToken) {
      await saveTokens({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
      return tokens.accessToken;
    }

    await clearStoredTokens();
    authFailureListener?.();
    return null;
  } catch {
    await clearStoredTokens();
    authFailureListener?.();
    return null;
  }
};

const parseJsonSafely = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return undefined;
  }
  try {
    return await response.json();
  } catch {
    return undefined;
  }
};

export const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = path.startsWith('http') ? path : `${baseUrl}${normalizedPath}`;

  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach stored access token if present and not already attached
  if (!headers.has('Authorization')) {
    const { accessToken } = await getStoredTokens();
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  const response = await fetch(fullUrl, {
    ...init,
    headers,
  });

  // Handle 401 Unauthorized with silent token refresh
  const isAuthEndpoint =
    normalizedPath.includes('/auth/login') || normalizedPath.includes('/auth/refresh');
  if (response.status === 401 && !isAuthEndpoint) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newAccessToken = await refreshPromise;
    if (newAccessToken) {
      // Retry request with new access token
      const retryHeaders = new Headers(init.headers);
      if (init.body && !retryHeaders.has('Content-Type')) {
        retryHeaders.set('Content-Type', 'application/json');
      }
      retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);

      const retryResponse = await fetch(fullUrl, {
        ...init,
        headers: retryHeaders,
      });

      const retryBody = await parseJsonSafely(retryResponse);
      if (!retryResponse.ok) {
        const errorMsg =
          typeof retryBody === 'object' && retryBody && 'message' in retryBody
            ? String((retryBody as { message: unknown }).message)
            : 'Request failed after refresh';
        throw new ApiClientError(errorMsg, retryResponse.status, retryBody);
      }

      if (retryBody && typeof retryBody === 'object' && 'data' in retryBody) {
        return (retryBody as { data: T }).data;
      }
      return retryBody as T;
    }

    throw new ApiClientError('Session expired. Please log in again.', 401);
  }

  const body = await parseJsonSafely(response);

  if (!response.ok) {
    const errorMsg =
      typeof body === 'object' && body && 'message' in body
        ? String((body as { message: unknown }).message)
        : 'The request could not be completed.';
    throw new ApiClientError(errorMsg, response.status, body);
  }

  if (body && typeof body === 'object' && 'data' in body) {
    return (body as { data: T }).data;
  }

  return body as T;
};

export const api = {
  get: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: 'GET' }),
  post: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: 'DELETE' }),
};
