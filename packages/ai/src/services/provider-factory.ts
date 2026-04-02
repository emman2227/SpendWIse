import type { AnalyticsProvider } from '../types';

import { MockAiProvider } from '../providers/mock-ai-provider';

export const createAnalyticsProvider = (provider = 'mock'): AnalyticsProvider => {
  // TODO: Add real provider adapters such as Gemini and wire their credentials via env config.
  switch (provider) {
    case 'mock':
    default:
      return new MockAiProvider();
  }
};
