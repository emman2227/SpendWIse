import type { Expense, Forecast, Insight } from '@spendwise/shared';

export const sampleExpenses: Expense[] = [
  {
    id: 'expense-1',
    userId: 'user-1',
    amount: 1850,
    categoryId: 'housing',
    description: 'Apartment rent',
    paymentMethod: 'bank_transfer',
    date: '2026-03-01T00:00:00.000Z',
    notes: 'Monthly recurring',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z'
  },
  {
    id: 'expense-2',
    userId: 'user-1',
    amount: 420,
    categoryId: 'food',
    description: 'Weekend groceries',
    paymentMethod: 'debit_card',
    date: '2026-03-20T00:00:00.000Z',
    createdAt: '2026-03-20T00:00:00.000Z',
    updatedAt: '2026-03-20T00:00:00.000Z'
  },
  {
    id: 'expense-3',
    userId: 'user-1',
    amount: 1200,
    categoryId: 'shopping',
    description: 'New office chair',
    paymentMethod: 'credit_card',
    date: '2026-03-25T00:00:00.000Z',
    createdAt: '2026-03-25T00:00:00.000Z',
    updatedAt: '2026-03-25T00:00:00.000Z'
  }
];

export const sampleInsights: Insight[] = [
  {
    id: 'insight-1',
    userId: 'user-1',
    type: 'summary',
    title: 'Dining is trending downward',
    message: 'You spent 18% less on food this month than last month, which helped keep your flexible spending stable.',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z'
  },
  {
    id: 'insight-2',
    userId: 'user-1',
    type: 'anomaly',
    title: 'Large shopping spike detected',
    message: 'A 1,200 office setup purchase is much higher than your typical shopping transactions. Consider tagging it as one-time.',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z'
  }
];

export const sampleForecast: Forecast = {
  id: 'forecast-1',
  userId: 'user-1',
  period: 'monthly',
  predictedAmount: 4380,
  confidence: 0.72,
  generatedAt: '2026-04-01T00:00:00.000Z'
};
