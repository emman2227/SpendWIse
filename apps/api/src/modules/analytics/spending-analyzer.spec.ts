import type { Category, Expense, Goal } from '@spendwise/shared';

import { SpendingAnalyzer } from './spending-analyzer';

describe('SpendingAnalyzer', () => {
  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      name: 'Dining',
      icon: 'utensils',
      color: '#ff6600',
      isSystemDefined: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cat-2',
      name: 'Groceries',
      icon: 'shopping-cart',
      color: '#00cc66',
      isSystemDefined: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const now = new Date();
  const currentMonthDate = now.toISOString();

  const mockExpenses: Expense[] = [
    {
      id: 'exp-1',
      userId: 'user-1',
      amount: 450,
      categoryId: 'cat-1',
      description: 'Restaurant Dinner',
      paymentMethod: 'credit_card',
      date: currentMonthDate,
      createdAt: currentMonthDate,
      updatedAt: currentMonthDate,
    },
  ];

  const mockGoals: Goal[] = [
    {
      id: 'goal-1',
      userId: 'user-1',
      title: 'Japan Vacation',
      targetAmount: 3000,
      currentAmount: 1000,
      targetDate: new Date(now.getFullYear(), now.getMonth() + 4, 1).toISOString(),
      createdAt: currentMonthDate,
      updatedAt: currentMonthDate,
    },
  ];

  it('should detect goal opportunities and generate recommendations', () => {
    const facts = SpendingAnalyzer.analyze(mockExpenses, [], mockCategories, mockGoals);
    const goalFact = facts.find(
      (f) => f.title.includes('Japan Vacation') || f.message.includes('Japan Vacation'),
    );

    expect(goalFact).toBeDefined();
    expect(goalFact?.type).toBe('recommendation');
    expect(goalFact?.evidence.targetAmount).toBe(3000);
    expect(goalFact?.evidence.currentProgress).toBe(1000);
  });

  it('should detect unusually large transaction spikes and duplicate charges', () => {
    const spikeExpenses: Expense[] = [
      {
        id: 'exp-hist-1',
        userId: 'user-1',
        amount: 25,
        categoryId: 'cat-1',
        description: 'Lunch',
        paymentMethod: 'credit_card',
        date: new Date(2026, 1, 10).toISOString(),
        createdAt: new Date(2026, 1, 10).toISOString(),
        updatedAt: new Date(2026, 1, 10).toISOString(),
      },
      {
        id: 'exp-hist-2',
        userId: 'user-1',
        amount: 30,
        categoryId: 'cat-1',
        description: 'Dinner',
        paymentMethod: 'credit_card',
        date: new Date(2026, 1, 12).toISOString(),
        createdAt: new Date(2026, 1, 12).toISOString(),
        updatedAt: new Date(2026, 1, 12).toISOString(),
      },
      {
        id: 'exp-spike',
        userId: 'user-1',
        amount: 320,
        categoryId: 'cat-1',
        description: 'Expensive Gala Dinner',
        paymentMethod: 'credit_card',
        date: new Date(2026, 1, 15).toISOString(),
        createdAt: new Date(2026, 1, 15).toISOString(),
        updatedAt: new Date(2026, 1, 15).toISOString(),
      },
      {
        id: 'exp-dup-1',
        userId: 'user-1',
        amount: 49.99,
        categoryId: 'cat-2',
        description: 'Software Subscription',
        paymentMethod: 'credit_card',
        date: new Date(2026, 1, 20).toISOString(),
        createdAt: new Date(2026, 1, 20).toISOString(),
        updatedAt: new Date(2026, 1, 20).toISOString(),
      },
      {
        id: 'exp-dup-2',
        userId: 'user-1',
        amount: 49.99,
        categoryId: 'cat-2',
        description: 'Software Subscription',
        paymentMethod: 'credit_card',
        date: new Date(2026, 1, 21).toISOString(),
        createdAt: new Date(2026, 1, 21).toISOString(),
        updatedAt: new Date(2026, 1, 21).toISOString(),
      },
    ];

    const alerts = SpendingAnalyzer.detectAlerts(spikeExpenses, [], mockCategories);
    expect(alerts.length).toBeGreaterThanOrEqual(2);

    const spikeAlert = alerts.find((a) => a.merchant === 'Expensive Gala Dinner');
    expect(spikeAlert).toBeDefined();
    expect(spikeAlert?.type).toBe('spike');

    const duplicateAlert = alerts.find((a) => a.type === 'duplicate');
    expect(duplicateAlert).toBeDefined();
    expect(duplicateAlert?.severity).toBe('danger');
  });
});
