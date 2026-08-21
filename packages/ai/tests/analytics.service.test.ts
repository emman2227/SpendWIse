import { describe, expect, it } from 'vitest';

import { MockAiProvider } from '../src/providers/mock-ai-provider';
import { createAnalyticsProvider } from '../src/services/provider-factory';

describe('MockAiProvider', () => {
  it('returns insight interpretations', async () => {
    const provider = new MockAiProvider();
    const results = await provider.interpretInsights([
      {
        type: 'anomaly',
        severity: 'warning',
        title: 'Unusual grocery expense',
        message: 'You spent 350 on groceries',
      },
    ]);

    expect(results.length).toBe(1);
    expect(results[0]?.title).toBe('Unusual grocery expense');
  });

  it('creates provider via factory', () => {
    const provider = createAnalyticsProvider('mock');
    expect(provider).toBeInstanceOf(MockAiProvider);
  });
});
