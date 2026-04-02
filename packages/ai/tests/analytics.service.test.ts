import { describe, expect, it } from 'vitest';

import type { Expense } from '@spendwise/shared';

import { MockAiProvider } from '../src/providers/mock-ai-provider';
import { AnalyticsService } from '../src/services/analytics.service';

const expenses: Expense[] = [
  {
    id: 'expense-1',
    userId: 'user-1',
    amount: 350,
    categoryId: 'groceries',
    description: 'Groceries',
    paymentMethod: 'debit_card',
    date: '2026-03-01T00:00:00.000Z',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z'
  },
  {
    id: 'expense-2',
    userId: 'user-1',
    amount: 1500,
    categoryId: 'shopping',
    description: 'Headphones',
    paymentMethod: 'credit_card',
    date: '2026-03-04T00:00:00.000Z',
    createdAt: '2026-03-04T00:00:00.000Z',
    updatedAt: '2026-03-04T00:00:00.000Z'
  }
];

describe('AnalyticsService', () => {
  it('returns insights for summaries and anomalies', async () => {
    const service = new AnalyticsService(new MockAiProvider());
    const insights = await service.buildInsights('user-1', expenses);

    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0]?.userId).toBe('user-1');
  });

  it('returns a forecast envelope', async () => {
    const service = new AnalyticsService(new MockAiProvider());
    const forecast = await service.forecast('user-1', expenses, 'monthly');

    expect(forecast.period).toBe('monthly');
    expect(forecast.predictedAmount).toBeGreaterThan(0);
  });
});
