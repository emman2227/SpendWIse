export const sampleExpenseSeeds = [
  {
    amount: 420,
    categoryId: 'Food & Dining',
    description: 'Weekly market run',
    paymentMethod: 'debit_card',
    date: '2026-04-01T00:00:00.000Z'
  },
  {
    amount: 210,
    categoryId: 'Transportation',
    description: 'Ride-share commute',
    paymentMethod: 'e_wallet',
    date: '2026-04-02T00:00:00.000Z'
  }
] as const;
