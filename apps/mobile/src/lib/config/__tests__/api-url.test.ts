import { describe, expect, it } from 'vitest';

import { resolveApiBaseUrl } from '../api-url';

describe('resolveApiBaseUrl', () => {
  it('returns explicit URL on iOS when provided', () => {
    const url = resolveApiBaseUrl({
      explicitUrl: 'https://api.spendwise.app/api/v1',
      platformOS: 'ios',
    });
    expect(url).toBe('https://api.spendwise.app/api/v1');
  });

  it('maps localhost to 10.0.2.2 on Android emulator', () => {
    const url = resolveApiBaseUrl({
      explicitUrl: 'http://localhost:4000/api/v1',
      platformOS: 'android',
    });
    expect(url).toBe('http://10.0.2.2:4000/api/v1');
  });

  it('maps 127.0.0.1 to 10.0.2.2 on Android emulator', () => {
    const url = resolveApiBaseUrl({
      explicitUrl: 'http://127.0.0.1:4000/api/v1',
      platformOS: 'android',
    });
    expect(url).toBe('http://10.0.2.2:4000/api/v1');
  });

  it('maps localhost to hostUri IP when running via Expo Go on a physical device', () => {
    const url = resolveApiBaseUrl({
      explicitUrl: 'http://localhost:4000/api/v1',
      hostUri: '192.168.1.100:8081',
      platformOS: 'ios',
    });
    expect(url).toBe('http://192.168.1.100:4000/api/v1');
  });

  it('defaults to localhost:4000/api/v1 on iOS when no explicit URL is given', () => {
    const url = resolveApiBaseUrl({
      platformOS: 'ios',
    });
    expect(url).toBe('http://localhost:4000/api/v1');
  });

  it('defaults to 10.0.2.2:4000/api/v1 on Android when no explicit URL is given', () => {
    const url = resolveApiBaseUrl({
      platformOS: 'android',
    });
    expect(url).toBe('http://10.0.2.2:4000/api/v1');
  });

  it('removes trailing slashes from API URL', () => {
    const url = resolveApiBaseUrl({
      explicitUrl: 'http://localhost:4000/api/v1/',
      platformOS: 'ios',
    });
    expect(url).toBe('http://localhost:4000/api/v1');
  });
});
