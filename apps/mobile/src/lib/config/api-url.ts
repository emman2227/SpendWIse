import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface ResolveApiUrlOptions {
  explicitUrl?: string;
  hostUri?: string | null;
  platformOS?: string;
}

export const resolveApiBaseUrl = ({
  explicitUrl,
  hostUri,
  platformOS = Platform.OS,
}: ResolveApiUrlOptions = {}): string => {
  let targetUrl = explicitUrl?.trim();

  if (!targetUrl) {
    if (hostUri) {
      const host = hostUri.split(':')[0] || 'localhost';
      targetUrl = `http://${host}:4000/api/v1`;
    } else if (platformOS === 'android') {
      targetUrl = 'http://10.0.2.2:4000/api/v1';
    } else {
      targetUrl = 'http://localhost:4000/api/v1';
    }
  }

  // If hostUri is present and URL references localhost / 127.0.0.1 (physical device connecting over LAN)
  if (hostUri && (targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1'))) {
    const host = hostUri.split(':')[0] || 'localhost';
    targetUrl = targetUrl.replace(/localhost|127\.0\.0\.1/g, host);
  } else if (
    platformOS === 'android' &&
    (targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1'))
  ) {
    targetUrl = targetUrl.replace(/localhost|127\.0\.0\.1/g, '10.0.2.2');
  }

  // Remove trailing slashes
  return targetUrl.replace(/\/+$/, '');
};

export const getApiBaseUrl = (): string => {
  return resolveApiBaseUrl({
    explicitUrl: process.env.EXPO_PUBLIC_API_URL,
    hostUri: Constants.expoConfig?.hostUri,
    platformOS: Platform.OS,
  });
};
