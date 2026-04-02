import type { Expense } from '@spendwise/shared';

export const mobileExpenses: Expense[] = [
  {
    id: 'expense-1',
    userId: 'user-1',
    amount: 210,
    categoryId: 'transportation',
    description: 'Ride-share commute',
    paymentMethod: 'e_wallet',
    date: '2026-04-01T00:00:00.000Z',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z'
  },
  {
    id: 'expense-2',
    userId: 'user-1',
    amount: 540,
    categoryId: 'food',
    description: 'Weekly market run',
    paymentMethod: 'debit_card',
    date: '2026-04-02T00:00:00.000Z',
    createdAt: '2026-04-02T00:00:00.000Z',
    updatedAt: '2026-04-02T00:00:00.000Z'
  }
];
