import { describe, expect, it } from 'vitest';

import { clearStoredTokens, getStoredTokens, saveTokens } from '../../auth/secure-storage';
import { api, ApiClientError } from '../client';

describe('Mobile API Client End-to-End Smoke Test', () => {
  it('authenticates against live API, rotates tokens, and accesses protected resources', async () => {
    // 1. Clear any prior storage
    await clearStoredTokens();

    // 2. Perform Login
    const loginPayload = {
      email: 'demo@spendwise.com',
      password: 'password123',
    };

    const loginResponse = await api.post<{
      user: { id: string; email: string; name: string };
      tokens: { accessToken: string; refreshToken: string; expiresIn: number };
    }>('/auth/login', loginPayload);

    expect(loginResponse.user.email).toBe('demo@spendwise.com');
    expect(loginResponse.tokens.accessToken).toBeDefined();
    expect(loginResponse.tokens.refreshToken).toBeDefined();

    // Save tokens in secure storage
    await saveTokens(loginResponse.tokens);

    // 3. Access Protected /users/me using stored accessToken
    const profile = await api.get<{ id: string; email: string; name: string }>('/users/me');
    expect(profile.id).toBe(loginResponse.user.id);
    expect(profile.email).toBe('demo@spendwise.com');

    // 4. Test Silent Token Refresh on 401
    // Simulate expired access token while keeping a valid refresh token
    const initialTokens = await getStoredTokens();
    await saveTokens({
      accessToken: 'invalid.expired.jwt',
      refreshToken: initialTokens.refreshToken!,
    });

    // The client should catch 401, call /auth/refresh silently, update stored tokens, and return user profile
    const profileAfterRefresh = await api.get<{ id: string; email: string }>('/users/me');
    expect(profileAfterRefresh.email).toBe('demo@spendwise.com');

    const rotatedTokens = await getStoredTokens();
    expect(rotatedTokens.accessToken).not.toBe('invalid.expired.jwt');
    expect(rotatedTokens.accessToken).toBeDefined();

    // 5. Cleanup
    await clearStoredTokens();
    const cleaned = await getStoredTokens();
    expect(cleaned.accessToken).toBeUndefined();
  });

  it('rejects with ApiClientError when unauthenticated on protected routes without tokens', async () => {
    await clearStoredTokens();

    await expect(api.get('/users/me')).rejects.toThrow(ApiClientError);
  });
});
