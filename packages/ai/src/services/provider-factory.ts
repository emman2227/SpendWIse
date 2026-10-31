import { DeterministicAnalyticsProvider } from '../providers/deterministic-provider';
import { GeminiAnalyticsProvider } from '../providers/gemini-provider';
import { MockAiProvider } from '../providers/mock-ai-provider';
import type { AnalyticsProvider } from '../types';

export const createAnalyticsProvider = (
  provider = 'deterministic',
  apiKey?: string,
): AnalyticsProvider => {
  switch (provider?.toLowerCase()) {
    case 'gemini':
      return new GeminiAnalyticsProvider(apiKey);
    case 'mock':
      return new MockAiProvider();
    case 'deterministic':
    default:
      return new DeterministicAnalyticsProvider();
  }
};
