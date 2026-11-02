import type { UserProfile } from '@spendwise/shared';
import { create } from 'zustand';

import { api, setOnAuthFailure } from '../lib/api/client';
import { clearStoredTokens, getStoredTokens, saveTokens } from '../lib/auth/secure-storage';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface SessionState {
  user: UserProfile | null;
  status: AuthStatus;
  error: string | null;
  initialize: () => Promise<void>;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  setError: (error: string | null) => void;
}

export const useSessionStore = create<SessionState>((set) => {
  // Wire up auto-logout when silent refresh fails in API client
  setOnAuthFailure(() => {
    set({ user: null, status: 'unauthenticated' });
  });

  return {
    user: null,
    status: 'idle',
    error: null,

    initialize: async () => {
      set({ status: 'loading', error: null });
      try {
        const { accessToken } = await getStoredTokens();
        if (!accessToken) {
          set({ user: null, status: 'unauthenticated' });
          return;
        }

        const user = await api.get<UserProfile>('/users/me');
        set({ user, status: 'authenticated' });
      } catch {
        await clearStoredTokens();
        set({ user: null, status: 'unauthenticated' });
      }
    },

    login: async (credentials) => {
      set({ status: 'loading', error: null });
      try {
        const response = await api.post<{
          user: UserProfile;
          tokens: { accessToken: string; refreshToken: string };
        }>('/auth/login', credentials);

        await saveTokens({
          accessToken: response.tokens.accessToken,
          refreshToken: response.tokens.refreshToken,
        });

        set({ user: response.user, status: 'authenticated', error: null });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to sign in';
        set({ status: 'unauthenticated', error: message });
        throw err;
      }
    },

    logout: async () => {
      try {
        await api.post('/auth/logout');
      } catch {
        // Ignore logout errors and proceed to wipe local credentials
      } finally {
        await clearStoredTokens();
        set({ user: null, status: 'unauthenticated', error: null });
      }
    },

    setError: (error) => set({ error }),
  };
});
