import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'spendwise_access_token';
const REFRESH_TOKEN_KEY = 'spendwise_refresh_token';

// In-memory fallback if SecureStore is unavailable in a test/mock environment
const memoryFallback = new Map<string, string>();

const isSecureStoreAvailable = async (): Promise<boolean> => {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
};

export interface StoredTokens {
  accessToken?: string;
  refreshToken?: string;
}

export const saveTokens = async (tokens: {
  accessToken: string;
  refreshToken: string;
}): Promise<void> => {
  const available = await isSecureStoreAvailable();
  if (available) {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
    ]);
  } else {
    memoryFallback.set(ACCESS_TOKEN_KEY, tokens.accessToken);
    memoryFallback.set(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }
};

export const getStoredTokens = async (): Promise<StoredTokens> => {
  const available = await isSecureStoreAvailable();
  if (available) {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    ]);
    return {
      accessToken: accessToken ?? undefined,
      refreshToken: refreshToken ?? undefined,
    };
  }

  return {
    accessToken: memoryFallback.get(ACCESS_TOKEN_KEY),
    refreshToken: memoryFallback.get(REFRESH_TOKEN_KEY),
  };
};

export const clearStoredTokens = async (): Promise<void> => {
  const available = await isSecureStoreAvailable();
  if (available) {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  } else {
    memoryFallback.delete(ACCESS_TOKEN_KEY);
    memoryFallback.delete(REFRESH_TOKEN_KEY);
  }
};
