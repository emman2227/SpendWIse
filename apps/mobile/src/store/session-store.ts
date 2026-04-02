import { create } from 'zustand';

interface SessionState {
  accessToken?: string;
  setAccessToken: (token?: string) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  accessToken: undefined,
  setAccessToken: (accessToken) => set({ accessToken })
}));
