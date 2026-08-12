import { GeminiAnalyticsProvider } from '../providers/gemini-provider';
import { MockAiProvider } from '../providers/mock-ai-provider';
import type { AnalyticsProvider } from '../types';

export const createAnalyticsProvider = (provider = 'mock', apiKey?: string): AnalyticsProvider => {
  switch (provider) {
    case 'gemini':
      return new GeminiAnalyticsProvider(apiKey);
    case 'mock':
    default:
      return new MockAiProvider();
  }
};
