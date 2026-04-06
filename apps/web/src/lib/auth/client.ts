'use client';

import type {
  CodeVerificationResult,
  PasswordResetResult,
  RegisterResult,
  UserProfile,
  VerificationDispatchResult,
} from '@spendwise/shared';
import { useQuery } from '@tanstack/react-query';

export const authQueryKey = ['auth', 'current-user'] as const;

export class AuthClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
  }
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

const request = async <T>(path: string, init: RequestInit = {}) => {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const response = await fetch(path, {
    ...init,
    cache: 'no-store',
    headers,
  });
  const body = await parseJsonSafely(response);

  if (!response.ok) {
    throw new AuthClientError(
      typeof body?.message === 'string' ? body.message : 'The request could not be completed.',
      response.status,
      body?.details,
    );
  }

  if (body && 'data' in body) {
    return body.data as T;
  }

  return body as T;
};

export const fetchCurrentUser = async () => {
  try {
    return await request<UserProfile>('/api/users/me');
  } catch (error) {
    if (error instanceof AuthClientError && [401, 403].includes(error.status)) {
      return null;
    }

    throw error;
  }
};

export const useCurrentUserQuery = () =>
  useQuery({
    queryKey: authQueryKey,
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 60_000,
  });

export const loginWithCredentials = (input: { email: string; password: string }) =>
  request<UserProfile>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const registerWithCredentials = (input: { name: string; email: string; password: string }) =>
  request<RegisterResult>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const verifyEmailCode = (input: { email: string; code: string }) =>
  request<UserProfile>('/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const resendVerificationCode = (input: { email: string }) =>
  request<VerificationDispatchResult>('/api/auth/resend-verification-code', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const requestPasswordReset = (input: { email: string }) =>
  request<VerificationDispatchResult>('/api/auth/request-password-reset', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const verifyPasswordResetCode = (input: { email: string; code: string }) =>
  request<CodeVerificationResult>('/api/auth/verify-password-reset-code', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const resetPassword = (input: { email: string; code: string; password: string }) =>
  request<PasswordResetResult>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const logoutSession = async () => {
  try {
    await request<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
    });
  } catch (error) {
    if (error instanceof AuthClientError && [401, 403].includes(error.status)) {
      return;
    }

    throw error;
  }
};

export const getAuthErrorMessage = (error: unknown, fallback: string) =>
  error instanceof AuthClientError ? error.message : fallback;
