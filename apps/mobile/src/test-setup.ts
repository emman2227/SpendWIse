import { vi } from 'vitest';

vi.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
  NativeModules: {},
}));

vi.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      hostUri: null,
    },
  },
}));

const mockStorage = new Map<string, string>();

vi.mock('expo-secure-store', () => ({
  isAvailableAsync: vi.fn().mockResolvedValue(true),
  setItemAsync: vi.fn().mockImplementation(async (key: string, value: string) => {
    mockStorage.set(key, value);
  }),
  getItemAsync: vi.fn().mockImplementation(async (key: string) => {
    return mockStorage.get(key) ?? null;
  }),
  deleteItemAsync: vi.fn().mockImplementation(async (key: string) => {
    mockStorage.delete(key);
  }),
}));
