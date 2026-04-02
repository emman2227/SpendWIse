import { create } from 'zustand';

interface AuthState {
  accessToken?: string;
  userName?: string;
  setSession: (payload: { accessToken: string; userName: string }) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: undefined,
  userName: undefined,
  setSession: (payload) => set(payload),
  clearSession: () => set({ accessToken: undefined, userName: undefined })
}));
